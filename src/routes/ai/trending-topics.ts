import express, { Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" }); // ✅ Load MISTRAL_API_KEY

const router = express.Router();

router.get("/", async (req: Request, res: Response): Promise<void> => {
  const category = req.query.category as string;

  let systemPrompt = "";
  let userPrompt = "";

  switch (category) {
    case "Technology":
      systemPrompt =
        "You are a technology news aggregator that provides real-time trending topics in the tech industry, including AI, FAANG companies (Facebook, Apple, Amazon, Netflix, Google), NVIDIA, OpenAI, and top startups.";
      userPrompt =
        "Give me exactly 5 trending technology topics today in short, clear headlines. Keep each topic under 10 words. Do not add descriptions.";
      break;
    case "Science":
      systemPrompt =
        "You are a science researcher that provides real-time trending topics in physics, space exploration, biology, and scientific breakthroughs.";
      userPrompt =
        "Give me exactly 5 trending science topics today in short, clear headlines. Keep each topic under 10 words. Do not add descriptions.";
      break;
    case "Health":
      systemPrompt =
        "You are a health and wellness expert that provides real-time trending topics in medical advancements, fitness trends, nutrition, and mental health.";
      userPrompt =
        "Give me exactly 5 trending health topics today in short, clear headlines. Keep each topic under 10 words. Do not add descriptions.";
      break;
    default:
      res.status(400).json({ error: "Invalid category. Choose from Technology, Science, or Health." });
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
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 100,
        top_p: 1,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.choices?.[0]?.message?.content) {
      throw new Error("Failed to fetch trending topics.");
    }

    const topics =
      data.choices[0].message.content
        .split("\n")
        .map((t: string) => t.replace(/^\d+\.\s*/, "").trim())
        .filter(Boolean)
        .slice(0, 5) || [];

    res.status(200).json({ topics });
  } catch (error: any) {
    console.error("❌ Mistral API error:", error);
    res.status(500).json({ error: "Failed to fetch trending topics", details: error.message });
  }
});

export default router;
