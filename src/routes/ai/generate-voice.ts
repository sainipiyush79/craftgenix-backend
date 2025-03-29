import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Default ElevenLabs Voice ID

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (!ELEVENLABS_API_KEY) {
    return res.status(500).json({ error: "Missing ELEVENLABS_API_KEY in environment variables." });
  }

  const { script } = req.body;
  if (!script) {
    return res.status(400).json({ error: "Missing script in request body." });
  }

  try {
    console.log("🔹 Requesting ElevenLabs for generated audio URL...");

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`, // ✅ Try /stream for sk_ keys
      {
        text: script,
        model_id: "eleven_monolingual_v1",
        voice_settings: { stability: 0.5, similarity_boost: 0.8 },
      },
      {
        headers: {
          "Authorization": `Bearer ${ELEVENLABS_API_KEY}`, // ✅ FIXED: Correct header
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer", // ✅ Handle binary audio response
      }
    );

    console.log("✅ ElevenLabs API Response Received.");

    // ✅ Save the audio file locally
    const fs = require("fs");
    const path = require("path");
    const audioPath = `/public/generated-audio.mp3`;
    fs.writeFileSync(path.resolve("." + audioPath), Buffer.from(response.data));

    console.log(`✅ Audio file saved: ${audioPath}`);

    res.status(200).json({ audioUrl: audioPath });
  } catch (error: any) {
    console.error("❌ ElevenLabs API Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate voiceover", details: error.response?.data || error.message });
  }
}
