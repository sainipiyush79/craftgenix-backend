import express, { Request, Response } from "express";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import axios from "axios";
import { promisify } from "util";

const router = express.Router();
const writeFile = promisify(fs.writeFile);
const WPS = 2.5; // Estimated speaking rate: Words per second

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { videos, sentences } = req.body;

  if (!videos || videos.length === 0 || !sentences || sentences.length === 0) {
    res.status(400).json({ error: "Videos and sentences are required" });
    return;
  }

  const outputDir = path.resolve("./public/videos/content-recorder");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const tempDir = path.join(outputDir, "temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const outputPath = path.join(outputDir, "merged-video.mp4");

  console.log("🔄 Downloading and trimming videos...");

  let durations: number[] = sentences.map((sentence: string) =>
    sentence.split(" ").length / WPS
  );

  let totalDuration: number = durations.reduce((sum: number, d: number) => sum + d, 0);

  if (totalDuration > 180) {
    console.warn("⚠️ Adjusting durations to fit within 3 minutes.");
    const scaleFactor: number = 180 / totalDuration;
    durations = durations.map((d: number) => d * scaleFactor);
  }

  const localVideoPaths: string[][] = [];

  

  for (let i = 0; i < videos.length; i++) {

    if (!videos[i] || videos[i].length === 0) {
      console.warn(`⚠️ Skipping sentence ${i} — no videos found.`);
      continue;
    }
    

    const sentenceDuration = durations[i];
    const numVideos = videos[i].length > 3 ? 3 : videos[i].length;
    const segmentDuration = sentenceDuration / numVideos;

    let sentenceVideos: string[] = [];

    for (let j = 0; j < numVideos; j++) {
      const localPath = path.join(tempDir, `video${i}-${j}.mp4`);

      try {
        const response = await axios({ url: videos[i][j], responseType: "stream" });
        const writer = fs.createWriteStream(localPath);
        response.data.pipe(writer);
        await new Promise<void>((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });

        const trimmedPath = path.join(tempDir, `trimmed${i}-${j}.mp4`);
        const success = await trimVideo(localPath, trimmedPath, segmentDuration);

        if (success) {
          sentenceVideos.push(trimmedPath);
        } else {
          console.warn(`⚠️ Skipping empty trimmed video: ${trimmedPath}`);
        }
      } catch (error) {
        console.error(`❌ Failed to download/trim video ${videos[i][j]}:`, error);
        res.status(500).json({ error: `Failed to process video: ${videos[i][j]}` });
        return;
      }
    }

    localVideoPaths.push(sentenceVideos);
  }

  console.log("✅ All videos downloaded and trimmed!");

  let sentenceMergedPaths: string[] = [];
  for (let i = 0; i < localVideoPaths.length; i++) {
    if (localVideoPaths[i].length === 0) continue;
    const sentenceOutputPath = path.join(tempDir, `sentence${i}.mp4`);
    if (fs.existsSync(sentenceOutputPath)) fs.unlinkSync(sentenceOutputPath);

    const fileListPath = path.join(tempDir, `fileList${i}.txt`);
    const fileListContent = localVideoPaths[i].map((video) => `file '${video}'`).join("\n");
    await writeFile(fileListPath, fileListContent);

    console.log(`🔄 Merging videos for sentence ${i}...`);

    try {
      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(fileListPath)
          .inputOptions(["-f concat", "-safe 0"])
          .outputOptions(["-c:v libx264", "-preset fast", "-crf 23", "-movflags", "faststart"])
          .output(sentenceOutputPath)
          .on("end", () => {
            console.log(`✅ Sentence ${i} video merged successfully.`);
            sentenceMergedPaths.push(sentenceOutputPath);
            resolve();
          })
          .on("error", (err) => reject(err))
          .run();
      });
    } catch (err) {
      res.status(500).json({ error: `Error merging sentence ${i} videos` });
      return;
    }
  }

  const finalFileListPath = path.join(tempDir, "finalFileList.txt");
  const finalFileListContent = sentenceMergedPaths.map((video) => `file '${video}'`).join("\n");
  await writeFile(finalFileListPath, finalFileListContent);

  console.log("🔄 Merging all sentences into final video...");

  try {
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(finalFileListPath)
        .inputOptions(["-f concat", "-safe 0"])
        .outputOptions(["-c:v libx264", "-preset fast", "-crf 23"])
        .output(outputPath)
        .on("end", () => {
          console.log("✅ Final video merged successfully!");
          cleanupTempFiles(tempDir);
          res.status(200).json({ finalVideo: "/videos/content-recorder/merged-video.mp4" });
          // res.status(200).json({
          //   finalVideo: `${process.env.BASE_URL || "http://localhost:5001"}/videos/content-recorder/merged-video.mp4`,
          // });
          
          resolve();
        })
        .on("error", (err) => reject(err))
        .run();
    });
  } catch (err) {
    console.error("❌ Error during final merge:", err);
    res.status(500).json({ error: "Unexpected error during video merging" });
  }
});

export default router;

async function trimVideo(inputPath: string, outputPath: string, duration: number): Promise<boolean> {
  return new Promise((resolve) => {
    ffmpeg(inputPath)
      .setDuration(duration)
      .output(outputPath)
      .on("end", () => resolve(true))
      .on("error", () => resolve(false))
      .run();
  });
}

function cleanupTempFiles(tempDir: string) {
  fs.readdir(tempDir, (err, files) => {
    if (err) return;
    for (const file of files) {
      fs.unlink(path.join(tempDir, file), () => {});
    }
    fs.rmdir(tempDir, () => {});
  });
}
