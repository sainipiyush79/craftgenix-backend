import { NextApiRequest, NextApiResponse } from "next";
import nlp from "compromise"; 

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { topic } = req.body;
  if (!topic) {
    return res.status(400).json({ error: "Topic is required" });
  }

  try {
    // **Step 1: Generate a 10-Sentence Fact-Based Tech News Script**
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
            content: `You are an expert tech journalist. Write **fact-based, engaging, and thought-provoking** technology news.
                      - **Exactly 5 sentences** (not more, not less).  
                      - **100% real-world tech updates, no fiction.**  
                      - **Make it exciting, suspenseful, and highly engaging.**  
                      - **Keep a smooth, natural flow from start to end.**  
                      - **Do not include scene headers, emojis, or special characters.**`
          },
          {
            role: "user",
            content: `Write a **viral-quality, engaging** technology news report on: **"${topic}"**.

            🔹 **Example Format:**
            "Google just announced its biggest AI update yet. The new Gemini AI model is capable of real-time multimodal understanding, handling text, images, and video simultaneously. Experts believe this could revolutionize search, education, and content creation. But here's the catch: it's also raising concerns about deepfakes and AI misinformation. Tech leaders are now debating stricter regulations, but is it too late? Meanwhile, Apple is secretly testing its own AI chip to compete with NVIDIA and OpenAI. Analysts say this could change the entire AI hardware landscape. Microsoft is betting big too, investing billions into next-gen AI data centers. The AI arms race is heating up faster than anyone predicted. The real question: Are we ready for an AI-dominated world?"

            **Now generate a similar real-world tech update in exactly 5 sentences.**`
          }
        ],
        temperature: 0.9,
        max_tokens: 500,
        top_p: 1,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.choices?.[0]?.message?.content) {
      console.error("Mistral API Response Error:", JSON.stringify(data, null, 2));
      throw new Error("Failed to generate tech news content.");
    }

    let script = data.choices[0].message.content.trim();

    // ✅ Remove unwanted text
    script = script
      .replace(/🎬|🎥|🔹|🔥/g, "") // Remove special symbols
      .replace(/\[.*?\]/g, "") // Remove scene markers
      .replace(/(\*\*.*?\*\*)/g, "") // Remove markdown formatting (**text**)
      .trim();

    // let sentences = script.split(/(?<=[.?!])\s+/).slice(0, 5);
    let sentences = script
  .replace(/\n/g, " ") // Convert new lines into spaces
  .match(/[^.!?]+[.!?]/g) || []; // Match full sentences

if (sentences.length < 5) {
  console.warn("⚠️ AI returned fewer than 5 sentences. Adjusting...");
  while (sentences.length < 5) {
    sentences.push("Some entertaining content"); // Add empty placeholders
  }
} else {
  sentences = sentences.slice(0, 5);
}


    // **Step 2: Extract 3-5 Key Topics from Each Sentence**
    const extractMainTopics = (sentences: string[]): string[][] => {
      return sentences.map((sentence) => {
        // ✅ Use NLP to extract nouns & key phrases
        const doc = nlp(sentence);
        let keywords = [
          ...doc.nouns().out("array"), // Extract nouns
          ...doc.people().out("array"), // Extract proper nouns (company names, etc.)
          ...doc.topics().out("array"), // Extract topic-related words
        ];
    
        // ✅ Clean and limit to 3-5 keywords per sentence
        return keywords
          .map((word) => word.trim())
          .filter((word) => word.length > 1) // Remove single characters
          .slice(0, 5); // Limit to 5 keywords
      });
    };
    let topics = await extractMainTopics(sentences);

    res.status(200).json({ script, topics });
  } catch (error: any) {
    console.error("❌ Mistral API error:", error);
    res.status(500).json({ error: "Failed to generate script", details: error.message });
  }
}
