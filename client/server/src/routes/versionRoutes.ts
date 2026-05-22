import express from "express";
import { Version } from "../models/Version";

const router = express.Router();

// Save a code snapshot version
router.post("/", async (req, res) => {
  try {
    const { roomId, code, language, username } = req.body;

    if (!roomId || !code || !language || !username) {
      res.status(400).json({ message: "roomId, code, language, and username are required fields" });
      return;
    }

    const newVersion = await Version.create({
      roomId,
      code,
      language,
      username
    });

    res.status(201).json({
      message: "Version snapshot saved successfully",
      version: newVersion
    });
  } catch (err) {
    console.error("Save Version Error:", err);
    res.status(500).json({ message: "Failed to save version snapshot" });
  }
});

// Fetch all version snapshots for a specific room
router.get("/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;

    if (!roomId) {
      res.status(400).json({ message: "roomId parameter is required" });
      return;
    }

    const versions = await Version.find({ roomId })
      .sort({ timestamp: -1 })
      .limit(30); // limit to last 30 snapshots to keep network payload light

    res.status(200).json({ versions });
  } catch (err) {
    console.error("Fetch Versions Error:", err);
    res.status(500).json({ message: "Failed to fetch version history" });
  }
});

export default router;
