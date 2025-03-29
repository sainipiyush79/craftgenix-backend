import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });


import express, { Request, Response } from "express";
import axios from "axios";


const router = express.Router();

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    console.error("❌ Pexels API Key is missing!");
    res.status(500).json({ error: "Pexels API Key is missing" });
    return;
  }

  const { sentences } = req.body;
  if (!sentences || !Array.isArray(sentences)) {
    res.status(400).json({ error: "Invalid request. Expected an array of short sentences." });
    return;
  }

  const videoUrls: string[] = [];

  for (const sentence of sentences) {
    try {
      const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(sentence)}&per_page=5&orientation=portrait`;
      console.log(`🌍 Fetching video for: "${sentence}" | URL: ${url}`);

      const response = await axios.get(url, {
        headers: { Authorization: apiKey },
      });

      if (response.status === 200 && response.data.videos.length > 0) {
        const selectedVideo =
          response.data.videos
            .flatMap((video: any) => video.video_files)
            .filter(
              (file: any) =>
                file.file_type === "video/mp4" &&
                file.width >= 720 &&
                file.height >= 1280
            )
            .map((file: any) => file.link)[0] || "";

        if (selectedVideo) {
          console.log(`🎥 Selected video for "${sentence}": ${selectedVideo}`);
          videoUrls.push(selectedVideo);
        } else {
          videoUrls.push("");
        }
      } else {
        console.warn(`⚠️ No videos found for: "${sentence}"`);
        videoUrls.push("");
      }
    } catch (error) {
      console.error(`❌ Error fetching video for "${sentence}":`, error);
      videoUrls.push("");
    }
  }

  console.log("📦 Final fetched videos:", videoUrls);
  res.status(200).json({ videos: videoUrls });
});

export default router;
