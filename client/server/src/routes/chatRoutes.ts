import express from "express";
import { Message } from "../models/Message";

const router = express.Router();

// GET /api/chat/:roomId — fetch last 100 messages for a room
router.get("/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;

    if (!roomId || !roomId.trim()) {
      res.status(400).json({ message: "roomId is required" });
      return;
    }

    // Fetch the last 100 messages sorted chronologically
    const messages = await Message.find({ roomId: roomId.trim() })
      .sort({ timestamp: 1 })
      .limit(100)
      .lean(); // .lean() returns plain JS objects — faster and less memory than full Mongoose docs

    const formattedMessages = messages.map((msg) => ({
      id: msg._id,
      socketId: msg.socketId,
      username: msg.username,
      text: msg.text,
      timestamp: msg.timestamp instanceof Date 
        ? msg.timestamp.toISOString() 
        : msg.timestamp 
          ? new Date(msg.timestamp).toISOString() 
          : new Date().toISOString()
    }));

    res.status(200).json(formattedMessages);
  } catch (err) {
    console.error("Error fetching chat history:", err);
    res.status(500).json({ message: "Server error fetching chat history" });
  }
});

export default router;
