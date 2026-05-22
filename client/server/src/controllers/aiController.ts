import { Request, Response } from "express";
import OpenAI from "openai";

// Instantiate once at module load — safe because apiKey is read from env at startup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy_key"
});

export const assistCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.body;

    // ── Input validation ──────────────────────────────────────────────────
    if (!code || typeof code !== "string" || !code.trim()) {
      res.status(400).json({ message: "code field is required and must be a non-empty string" });
      return;
    }

    // ── Fallback: no API key configured ──────────────────────────────────
    if (!process.env.OPENAI_API_KEY) {
      // Await the delay so the response is tied to the request lifecycle
      await new Promise<void>((resolve) => setTimeout(resolve, 1500));
      res.status(200).json({
        suggestion: [
          "// [AI]: Looks like you're testing the AI assist!",
          "// Add your OPENAI_API_KEY to server/.env to get real suggestions.",
          "",
          code,
          "",
          "// AI suggested improvement:",
          'console.log("AI says hello!");'
        ].join("\n")
      });
      return;
    }

    // ── Real OpenAI request ───────────────────────────────────────────────
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are an expert AI coding assistant. Review the provided code and return the improved, refactored, or fixed version. Only return raw code without markdown backticks or explanation blocks so it can be inserted directly into an editor."
        },
        {
          role: "user",
          content: `Please fix and improve this code:\n\n${code}`
        }
      ]
    });

    const suggestion = completion.choices[0]?.message?.content ?? "";
    res.status(200).json({ suggestion });
  } catch (err) {
    console.error("AI Assist Error:", err);
    res.status(500).json({ message: "Failed to generate AI suggestion." });
  }
};
