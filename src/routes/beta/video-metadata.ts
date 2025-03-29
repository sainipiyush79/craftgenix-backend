import express, { Request, Response } from "express";
import fetch from "node-fetch";

const router = express.Router();

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { prompt } = req.body;

  if (!prompt) {
    res.status(400).json({ error: "Prompt is required" });
    return;
  }

  try {
    console.log("🔹 Generating video metadata for:", prompt);

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-medium",
        messages: [
          {
            role: "system",
            content: `You are an AI that generates metadata for YouTube videos.
                      Given a video topic prompt, return:
                      - A short, **clickbait-style title**.
                      - A **compelling video description**.
                      - A **comma-separated list of at most 10 SEO-friendly tags**.`
          },
          {
            role: "user",
            content: `Generate metadata for this video title: **"${prompt}"**`
          }
        ],
        temperature: 0.7,
        max_tokens: 250,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.choices?.[0]?.message?.content) {
      throw new Error("Failed to generate metadata.");
    }

    const metadataText = data.choices[0].message.content.trim();

    const titleMatch = metadataText.match(/title:\s*(.+)/i);
    const descriptionMatch = metadataText.match(/description:\s*(.+)/i);
    const tagsMatch = metadataText.match(/tags:\s*(.+)/i);

    const title = titleMatch ? titleMatch[1].trim() : "Generated Title";
    const description = descriptionMatch ? descriptionMatch[1].trim() : "";
    const tags = tagsMatch ? tagsMatch[1].split(",").map((tag: string) => tag.trim()) : [];

    res.status(200).json({ title, description, tags });
  } catch (error) {
    console.error("❌ Error generating metadata:", error);
    res.status(500).json({ error: "Failed to generate video metadata" });
  }
});

export default router;
