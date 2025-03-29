import express, { Request, Response } from "express";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";

const router = express.Router();

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { videos, recordedVideo } = req.body;

  if (!videos || videos.length === 0 || !recordedVideo) {
    res.status(400).json({ error: "Videos and recordedVideo are required." });
    return;
  }

  const outputDir = path.resolve("./public/videos/content-recorder/");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const pexelsVideoPath = path.join(outputDir, "merged-video.mp4");
  const recordedVideoPath = path.join(outputDir, "recorded.mp4");
  const finalVideoPath = path.join(outputDir, "final-merged.mp4");

  console.log("🔄 Processing final merge...");

  if (!fs.existsSync(pexelsVideoPath)) {
    res.status(500).json({ error: `Pexels video file not found: ${pexelsVideoPath}` });
    return;
  }

  if (!fs.existsSync(recordedVideoPath)) {
    res.status(500).json({ error: `Recorded video file not found: ${recordedVideoPath}` });
    return;
  }

  try {
    console.log("✅ Videos are valid! Normalizing...");

    const resizedPexels = path.join(outputDir, "pexels_resized.mp4");
    const resizedRecorded = path.join(outputDir, "recorded_resized.mp4");

    await new Promise<void>((resolve, reject) => {
      ffmpeg(pexelsVideoPath)
        .outputOptions([
          "-vf",
          "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2"
        ])
        .save(resizedPexels)
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        
    });

    await new Promise<void>((resolve, reject) => {
      ffmpeg(recordedVideoPath)
        .outputOptions([
          "-vf",
          "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2"
        ])
        .save(resizedRecorded)
        .on("end", () => resolve())
        .on("error", reject);
    });

    console.log("✅ Videos resized correctly!");

    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(resizedPexels)
        .input(resizedRecorded)
        .complexFilter([
          "[0:v]crop=iw:ih/2:0:ih/4[top]; [1:v]crop=iw:ih/2:0:ih/2[bottom]; [top][bottom]vstack=inputs=2[outv]"
        ])
        .map("[outv]")
        .outputOptions([
          "-c:v libx264",
          "-preset fast",
          "-crf 23",
          "-pix_fmt yuv420p"
        ])
        .output(finalVideoPath)
        .on("end", () => {
          console.log("✅ Final video merged successfully!");
          res.status(200).json({ finalVideo: "/videos/content-recorder/final-merged.mp4" });
          resolve();
        })
        .on("error", (err) => {
          console.error("❌ Error merging videos:", err);
          res.status(500).json({ error: "Error merging videos", details: err.message });
          reject(err);
        })
        .run();
    });

  } catch (error: any) {
    console.error("❌ Unexpected error during merging:", error);
    res.status(500).json({ error: "Unexpected error during video merging" });
  }
});

export default router;
