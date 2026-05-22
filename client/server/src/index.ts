import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import http from "http";
import { Server } from "socket.io";
import { MongoMemoryServer } from "mongodb-memory-server";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import authRoutes from "./routes/authRoutes";
import aiRoutes from "./routes/aiRoutes";
import executeRoutes from "./routes/executeRoutes";
import chatRoutes from "./routes/chatRoutes";
import versionRoutes from "./routes/versionRoutes";
import { Message } from "./models/Message";

// Load env vars first — before any other code reads process.env
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "*",
    methods: ["GET", "POST"]
  }
});

// Security Middleware — helmet sets protective HTTP headers
app.use(helmet());

// Global Rate Limiter: protect endpoints from abuse
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Limit each IP to 150 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { message: "Too many requests from this IP, please try again after 15 minutes." }
});

// Apply rate limiter to API endpoints
app.use("/api/", globalLimiter);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));
app.use(express.json({ limit: "1mb" })); // Guard against oversized payloads

// ── Database ─────────────────────────────────────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/codesync";
let mongoServerInstance: MongoMemoryServer | null = null;

const connectDB = async (): Promise<void> => {
  try {
    if (MONGODB_URI.includes("localhost")) {
      console.log("Starting temporary In-Memory MongoDB for local development...");
      mongoServerInstance = await MongoMemoryServer.create();
      const uri = mongoServerInstance.getUri();
      await mongoose.connect(uri);
      console.log("Connected to In-Memory MongoDB!");
    } else {
      await mongoose.connect(MONGODB_URI);
      console.log("Connected to MongoDB Atlas!");
    }
  } catch (err) {
    console.error("MongoDB connection error:", err);
    // Exit so the process doesn't silently run without a database
    process.exit(1);
  }
};

// ── Routes ───────────────────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/execute", executeRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/versions", versionRoutes);

app.get("/", (_req, res) => {
  res.send("CodeLink Backend Running");
});

// ── Error Handling ───────────────────────────────────────────────────────────

// Catch-all 404 handler for API routes
app.use("/api", (_req, res) => {
  res.status(404).json({ message: "API endpoint not found" });
});

// Global internal server error handler middleware
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled Application Error:", err);
  const errorObj = err as Error & { status?: number };
  const statusCode = errorObj.status || 500;
  
  res.status(statusCode).json({
    message: errorObj.message || "An unexpected server error occurred",
    ...(process.env.NODE_ENV === "development" ? { stack: errorObj.stack } : {})
  });
});

// ── Socket.IO ────────────────────────────────────────────────────────────────

const socketToUserMap: Record<string, string> = {};

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join-room", ({ roomId, username }: { roomId: string; username: string }) => {
    socket.join(roomId);
    socketToUserMap[socket.id] = username;
    console.log(`${username} joined room ${roomId}`);

    // Helper: snapshot all clients currently in the room
    const getClientsInRoom = () => {
      const room = io.sockets.adapter.rooms.get(roomId);
      if (!room) return [];
      return Array.from(room).map((sid) => ({
        socketId: sid,
        username: socketToUserMap[sid]
      }));
    };

    const clients = getClientsInRoom();

    // Broadcast to everyone in the room (including the new joiner)
    io.in(roomId).emit("user-joined", {
      socketId: socket.id,
      username,
      clients
    });

    socket.on("code-change", ({ roomId: rid, code }: { roomId: string; code: string }) => {
      socket.to(rid).emit("code-change", { code });
    });

    socket.on("language-change", ({ roomId: rid, language }: { roomId: string; language: string }) => {
      socket.to(rid).emit("language-change", { language });
    });

    socket.on("cursor-move", ({ roomId: rid, cursor }: { roomId: string; cursor: unknown }) => {
      socket.to(rid).emit("cursor-move", {
        socketId: socket.id,
        username,
        cursor
      });
    });

    socket.on("typing", ({ roomId: rid, username: typingUser, isTyping }: { roomId: string; username: string; isTyping: boolean }) => {
      socket.to(rid).emit("typing", { username: typingUser, isTyping });
    });

    // ── WebRTC Signaling Relays ──────────────────────────────────────────────
    socket.on("join-call", ({ roomId: rid }: { roomId: string }) => {
      socket.to(rid).emit("user-joined-call", { socketId: socket.id, username });
    });

    socket.on("webrtc-signal", ({ targetSocketId, signalData }: { targetSocketId: string; signalData: unknown }) => {
      io.to(targetSocketId).emit("webrtc-signal", {
        senderSocketId: socket.id,
        signalData
      });
    });

    socket.on("leave-call", ({ roomId: rid }: { roomId: string }) => {
      socket.to(rid).emit("user-left-call", { socketId: socket.id, username });
    });

    socket.on("send-message", async ({ roomId: rid, message }: { roomId: string; message: string }) => {
      // Guard: ignore empty messages
      if (!message || !message.trim()) return;

      try {
        const newMessage = await Message.create({
          roomId: rid,
          socketId: socket.id,
          username,
          text: message.trim()
        });

        io.in(rid).emit("receive-message", {
          id: newMessage._id,
          socketId: socket.id,
          username,
          text: message.trim(),
          timestamp: newMessage.timestamp.toISOString()
        });
      } catch (err) {
        console.error("Error saving message:", err);
      }
    });

    // Handle disconnecting — client is still technically in rooms here,
    // so we can compute the updated room list before the socket leaves
    socket.on("disconnecting", () => {
      const leavingUsername = socketToUserMap[socket.id];

      for (const room of socket.rooms) {
        // Skip the socket's own private room (same as socket.id)
        if (room === socket.id) continue;

        const roomSet = io.sockets.adapter.rooms.get(room);
        const updatedClients = roomSet
          ? Array.from(roomSet)
              .filter((id) => id !== socket.id)
              .map((id) => ({ socketId: id, username: socketToUserMap[id] }))
          : [];

        socket.to(room).emit("user-left", {
          socketId: socket.id,
          username: leavingUsername,
          clients: updatedClients
        });

        socket.to(room).emit("user-left-call", {
          socketId: socket.id,
          username: leavingUsername
        });
      }
    });
  });

  socket.on("disconnect", () => {
    delete socketToUserMap[socket.id];
    console.log("User disconnected:", socket.id);
  });
});

// ── Startup ──────────────────────────────────────────────────────────────────

// Catch unhandled promise rejections so the process doesn't silently die
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

const start = async (): Promise<void> => {
  // Attach error handler BEFORE listen so no event is missed
  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\n⚠️  Port ${PORT} is already in use.\n   Stop the other server or set a different PORT in server/.env\n`);
      process.exit(1);
    } else {
      throw err;
    }
  });

  // Connect to DB first — routes should not serve traffic until DB is ready
  await connectDB();

  server.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
};

start();

// ── Graceful Shutdown ────────────────────────────────────────────────────────

const shutdown = async (signal: string): Promise<void> => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);

  // Stop accepting new socket connections and HTTP requests
  io.close();
  server.close(async () => {
    console.log("HTTP server closed.");
    try {
      // Disconnect from MongoDB
      await mongoose.disconnect();
      console.log("MongoDB connection closed.");

      // Stop In-Memory MongoDB if it was started
      if (mongoServerInstance) {
        await mongoServerInstance.stop();
        console.log("In-Memory MongoDB stopped.");
      }
    } catch (err) {
      console.error("Error during database disconnection:", err);
    }
    process.exit(0);
  });

  // Force close after 5 seconds if graceful shutdown hangs
  setTimeout(() => {
    console.error("Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 5000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));