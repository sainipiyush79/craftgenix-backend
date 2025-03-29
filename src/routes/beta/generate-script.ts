import dotenv from "dotenv";
dotenv.config({ path: ".env.local" }); // ✅ MUST be called early

import express, { Request, Response } from "express";
import fetch from "node-fetch";
import nlp from "compromise";




const router = express.Router();

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { topic } = req.body;

  if (!topic) {
    res.status(400).json({ error: "Topic is required" }); // ✅ no return value
    return;
  }
  

  try {
    console.log("🔹 Generating highly optimized script for:", topic);
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
            content: `You are an AI that generates **highly specific** and **visually striking** short-form video search prompts.
                      - Generate **exactly 20 short sentences** with **strong action words**.
                      - Each sentence should describe a **real-world scene** that could exist as a video.
                      - Format: **[Action] + [Subject] + [Location]**
                      - Example: 
                          - "Surfer rides massive wave"
                          - "Golden retriever plays beach"
                          - "Ballet dancer twirls stage"
                      - **Do not use abstract, unclear, or vague words**.
                      - **Focus on outdoor settings, nature, sports, cityscapes, human activities, and animals**.
                      - **Avoid generic words like 'person', 'thing', 'event'**. Instead, specify.
                      - **Make sure the descriptions will match actual stock videos available on Pexels.**`
          },
          {
            role: "user",
            content: `Write 20 **video search prompts** for a topic: **"${topic}"**`
          }
        ],
        temperature: 0.6,
        max_tokens: 500,
        top_p: 1,
      }),
    });

    const data = await response.json();
    console.log("🔍 Mistral Response:", JSON.stringify(data, null, 2));
    console.log("📦 Mistral Status:", response.status);
 


    if (!response.ok || !data.choices?.[0]?.message?.content) {
      throw new Error("Failed to generate sentences.");
    }

    let script = data.choices[0].message.content.trim();

    // ✅ Remove unwanted escape characters
    script = script.replace(/["]+/g, "").replace(/\n/g, " ").trim();

    // console.log("✅ AI Generated Script:", script);

    // ✅ Extract and optimize keywords using NLP
    const extractKeywords = (text: string): string[] => {
      const sentences = text.match(/[^.!?]+[.!?]/g) || [];
      return sentences.map((sentence) => {
        const doc = nlp(sentence);
        let keywords = doc.nouns().out("array"); // Extract nouns
        let actions = doc.verbs().out("array"); // Extract actions
        let finalKeywords = [...actions, ...keywords]
          .filter((word: string) => word.length > 3)
          .slice(0, 5)
          .join(" ");
        return finalKeywords;
      });
    };

    const sentences = extractKeywords(script).filter((s) => s.length > 3);
    // console.log("✅ Optimized Sentences for Pexels Search:", sentences);

    res.status(200).json({ sentences });
  } catch (error) {
    console.error("❌ Error generating script:", error);
    res.status(500).json({ error: "Failed to generate script" });
  }
});

export default router;
