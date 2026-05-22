import mongoose from "mongoose";

const versionSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  code: { type: String, required: true },
  language: { type: String, required: true },
  username: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

export const Version = mongoose.model("Version", versionSchema);
