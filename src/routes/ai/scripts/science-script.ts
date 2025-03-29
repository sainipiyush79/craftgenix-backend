// src/routes/ai/scripts/science-script.ts
import express, { Request, Response } from "express";
import fetch from "node-fetch";
import nlp from "compromise";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const router = express.Router();

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { topic } = req.body;
  console.error(" Generating science script:", topic);

  if (!topic) {
    res.status(400).json({ error: "Topic is required" });
    return;
  }

  try {
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-medium",
        messages: [
          {
            role: "system",
            content: `You are an AI scriptwriter for viral science content.
                      - **Exactly 5 sentences**
                      - **Exciting, thought-provoking, and real-world science facts**
                      - **Clear and natural storytelling**
                      - **No labels like "Hook", "Engagement", "Payoff"**
                      - **Write as if a human is naturally narrating it**
                      - **Keep it exciting, thought-provoking, and immersive**
                      - **Should sound natural for short-form video narration**
                      - **No unnecessary complexity or long explanations**`,
          },
          {
            role: "user",
            content: `Write a **viral-quality, engaging** science short-form script on: **"${topic}"**.`,
          },
        ],
        temperature: 0.85,
        max_tokens: 500,
        top_p: 1,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.choices?.[0]?.message?.content) {
      throw new Error("Failed to generate science script.");
    }

    let script = data.choices[0].message.content.trim();
    script = script.replace(/\n/g, " ").replace(/\[.*?\]/g, "").trim();

    const extractMainTopics = (text: string): string[][] => {
      const sentences = text.match(/[^.!?]+[.!?]/g) || [];
      return sentences.map((sentence) => {
        const doc = nlp(sentence);
        const keywords = [
          ...doc.nouns().out("array"),
          ...doc.people().out("array"),
          ...doc.topics().out("array"),
        ];
        return keywords.filter((word) => word.length > 1).slice(0, 5);
      });
    };

    const topics = extractMainTopics(script);
    res.status(200).json({ script, topics });
  } catch (error) {
    console.error("❌ Error generating science script:", error);
    res.status(500).json({ error: "Failed to generate script" });
  }
});

export default router;
