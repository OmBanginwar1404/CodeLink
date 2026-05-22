import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretcodesyncjwtkey";
const SALT_ROUNDS = 12; // bcrypt cost factor (was 10 — 12 is industry standard minimum)

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    // ── Input validation ────────────────────────────────────────────────────
    if (!username || !email || !password) {
      res.status(400).json({ message: "username, email and password are required" });
      return;
    }

    if (typeof password !== "string" || password.length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters" });
      return;
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Standard RFC email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      res.status(400).json({ message: "Invalid email format" });
      return;
    }

    // ── Duplicate check ─────────────────────────────────────────────────────
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: String(username).trim() }]
    });
    if (existingUser) {
      res.status(409).json({ message: "A user with that email or username already exists" });
      return;
    }

    // ── Hash password ───────────────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // ── Create user ─────────────────────────────────────────────────────────
    const newUser = new User({
      username: String(username).trim(),
      email: normalizedEmail,
      password: hashedPassword
    });

    await newUser.save();

    // ── Issue JWT ───────────────────────────────────────────────────────────
    const token = jwt.sign(
      { id: newUser._id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // ── Input validation ────────────────────────────────────────────────────
    if (!email || !password) {
      res.status(400).json({ message: "email and password are required" });
      return;
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // ── Find user ───────────────────────────────────────────────────────────
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Use a generic message to avoid user-enumeration attacks
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // ── Verify password ─────────────────────────────────────────────────────
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // ── Issue JWT ───────────────────────────────────────────────────────────
    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Logged in successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
};
