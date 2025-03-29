// src/routes/ai/scripts/health-script.ts
import express, { Request, Response } from "express";
import fetch from "node-fetch";
import nlp from "compromise";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const router = express.Router();

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { topic } = req.body;

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
            content: `You are an AI assistant writing engaging short-form health content.
                      - **Exactly 5 sentences**
                      - **Informative, valuable, and practical health insights**
                      - **Clear and natural storytelling**
                      - **No labels like "Hook", "Engagement", "Payoff"**
                      - **Write as if a human is naturally narrating it**
                      - **Keep it exciting, thought-provoking, and immersive**
                      - **Should be easy to narrate for video content**
                      - **Avoid excessive medical jargon**`,
          },
          {
            role: "user",
            content: `Write a **viral-quality, engaging** health short-form script on: **"${topic}"**.`,
          },
        ],
        temperature: 0.85,
        max_tokens: 500,
        top_p: 1,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.choices?.[0]?.message?.content) {
      throw new Error("Failed to generate health script.");
    }

    let script = data.choices[0].message.content.trim();
    script = script.replace(/\n/g, " ").replace(/\[.*?\]/g, "").trim();

    // const extractMainTopics = (text: string): string[][] => {
    //   const sentences = text.match(/[^.!?]+[.!?]/g) || [];
    //   return sentences.map((sentence) => {
    //     const doc = nlp(sentence);
    //     let keywords = [
    //       ...doc.nouns().out("array"),
    //       ...doc.people().out("array"),
    //       ...doc.topics().out("array"),
    //     ];
    //     return keywords.filter((word) => word.length > 1).slice(0, 5);
    //   });
    // };

    // const topics = extractMainTopics(script);


    // Step 2: Ask Mistral to generate video search prompts per sentence
const promptForTopics = `
You are a video search assistant. 
Given the following script for a health video, generate **exactly 5 short search queries** 
(1 per sentence) that describe realistic, visual scenes for stock video search. 

- Each query must be under 8 words.
- Each must describe a specific **visual scene**: [action] + [subject] + [setting]
- Avoid abstract terms or jargon.

SCRIPT:
"${script}"
`;

const topicResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "mistral-medium",
    messages: [
      { role: "system", content: "You generate realistic, visual video search prompts." },
      { role: "user", content: promptForTopics },
    ],
    temperature: 0.7,
    max_tokens: 200,
  }),
});

const topicData = await topicResponse.json();

let topics: string[] = topicData.choices?.[0]?.message?.content
  ?.split("\n")
  .map((t: string) => t.replace(/^\d+\.\s*/, "").trim())
  .filter(Boolean)
  .slice(0, 5) || [];


    res.status(200).json({ script, topics });
  } catch (error) {
    console.error("❌ Error generating health script:", error);
    res.status(500).json({ error: "Failed to generate script" });
  }
});


export default router;
