// src/routes/fetch-videos.ts
import express, { Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" }); // ✅ Load env early

const router = express.Router();

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey) {
    console.error("❌ Pexels API Key is missing!");
    res.status(500).json({ error: "Pexels API Key is missing" });
    return;
  }

  const { topics } = req.body;
  if (!topics || !Array.isArray(topics)) {
    res.status(400).json({ error: "Invalid request. Expected an array of topics." });
    return;
  }

  let videoUrls: string[][] = [];

  for (const topic of topics) {
    try {
      const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(topic)}&per_page=8&orientation=portrait`;
      console.log(`🌍 Fetching videos for: ${topic} | URL: ${url}`);

      const response = await axios.get(url, { headers: { Authorization: apiKey } });

      if (response.status === 200 && response.data.videos.length > 0) {
        const selectedVideos = response.data.videos
          .flatMap((video: any) => video.video_files)
          .filter((file: any) => file.width === 720 && file.height === 1280 && file.file_type === "video/mp4")
          .slice(0, 5)
          .map((file: any) => file.link);

        videoUrls.push(selectedVideos.length ? selectedVideos : []);
        console.log(`🎥 Selected ${selectedVideos.length} for "${topic}"`);
      } else {
        console.warn(`⚠️ No videos found for topic: ${topic}`);
        videoUrls.push([]);
      }
    } catch (error) {
      console.error(`❌ Error fetching video for ${topic}:`, error);
      videoUrls.push([]);
    }
  }

  console.log("📦 Final fetched videos:", videoUrls);
  res.status(200).json({ videos: videoUrls });
});

export default router;
