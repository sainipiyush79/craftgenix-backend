// src/routes/api/cleanup.ts
import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

router.post("/", async (_req: Request, res: Response) => {
  const videoDir = path.resolve("./public/videos");
  const filesToDelete = [
    "merged-video.mp4",
    "recorded.mp4",
    "final-merged.mp4",
    "pexels_resized.mp4",
    "recorded_resized.mp4",
    "final-with-music.mp4",
  ];

  try {
    filesToDelete.forEach((file) => {
      const filePath = path.join(videoDir, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🧹 Deleted: ${file}`);
      }
    });

    // Clean temp folder
    const tempDir = path.join(videoDir, "temp");
    if (fs.existsSync(tempDir)) {
      fs.readdirSync(tempDir).forEach((file) => {
        fs.unlinkSync(path.join(tempDir, file));
      });
      fs.rmdirSync(tempDir);
      console.log("🧹 Cleaned up temp directory");
    }

    res.status(200).json({ message: "Cleanup complete" });
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    res.status(500).json({ error: "Cleanup failed" });
  }
});

export default router;
