import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import axios from "axios";
import ffmpeg from "fluent-ffmpeg";
import formidable from "formidable";
import { promisify } from "util";

const router = express.Router();

export const config = {
  api: {
    bodyParser: false,
  },
};

const parseForm = async (req: Request): Promise<{ fields: any }> => {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: true });
    form.parse(req, (err, fields) => {
      if (err) return reject(err);
      resolve({ fields });
    });
  });
};

router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { fields } = await parseForm(req);
    const selectedVideos = JSON.parse(fields.videoUrls[0]);

 const musicFileUrl = Array.isArray(fields.musicFileUrl)
  ? fields.musicFileUrl[0]
  : fields.musicFileUrl;


    if (!selectedVideos.length) {
      res.status(400).json({ error: "No videos selected" });
      return;
    }

    console.log("✅ Processing Videos:", selectedVideos);
    console.log(
      "✅ Selected Music File:",
      musicFileUrl || "No music selected"
    );

    const tempDir = path.resolve("./public/videos/temp");
    const outputDir = path.resolve("./public/videos");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    let localVideoPaths: string[] = [];

    for (const video of selectedVideos) {
      const localPath = path.join(tempDir, `video-${video.order}.mp4`);
      await downloadFile(video.url, localPath);
      localVideoPaths.push(localPath);
    }

    console.log("✅ All videos downloaded!");

    let processedVideoPaths: string[] = [];
    let totalDuration = 0; // ✅ Add this line

    for (const videoPath of localVideoPaths) {
      const outputTrimmedPath = path.join(
        tempDir,
        `trimmed-${path.basename(videoPath)}`
      );
      const duration = await getVideoDuration(videoPath);

      let targetDuration = duration < 5 ? duration : 5;

      if (totalDuration + targetDuration > 180) break; // ✅ Cap total video time

      await trimAndResizeVideo(videoPath, outputTrimmedPath, targetDuration);
      processedVideoPaths.push(outputTrimmedPath);
      totalDuration += targetDuration; // ✅ Track duration only after successful trim
    }

    console.log("✅ Videos trimmed & resized!");

    const finalMergedVideo = path.join(outputDir, "final-merged.mp4");
    const fileListPath = path.join(tempDir, "file-list.txt");
    await promisify(fs.writeFile)(
      fileListPath,
      processedVideoPaths.map((video) => `file '${video}'`).join("\n")
    );

    console.log("🔄 Merging videos...");
    await mergeVideos(fileListPath, finalMergedVideo);
    console.log("✅ Videos merged successfully!");



    if (musicFileUrl) {
      let musicFilePath = "";
    
      if (musicFileUrl.startsWith("/music/")) {
        // 👉 Fix: Join with actual public path on disk
        musicFilePath = path.join(__dirname, "../../../public", musicFileUrl); 
      } else {
        // Remote Jamendo URL
        musicFilePath = path.resolve(tempDir, "background-music.mp3");
        console.log("🎧 Downloading music...");
        await downloadMusicFile(musicFileUrl, musicFilePath);
      }
      
    
      if (!fs.existsSync(musicFilePath)) {
        throw new Error("Music file not found at: " + musicFilePath);
      }
    
      const finalWithMusic = path.join(outputDir, "final-with-music.mp4");
      console.log("🔄 Adding background music...");
      await addMusicToVideo(finalMergedVideo, musicFilePath, finalWithMusic);
      console.log("✅ Music added successfully!");
      res.status(200).json({ final_video_url: `/videos/final-with-music.mp4` });
      return;
    }
    


    res.status(200).json({ final_video_url: `/videos/final-merged.mp4` });
    return;
  } catch (error) {
    console.error("❌ API Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;

const downloadFile = async (url: string, outputPath: string) => {
  const response = await axios({ url, responseType: "stream" });
  const writer = fs.createWriteStream(outputPath);
  response.data.pipe(writer);
  return new Promise<void>((resolve, reject) => {
    writer.on("finish", () => resolve());
    writer.on("error", (err) => reject(err));
  });
};

const getVideoDuration = (videoPath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) reject(err);
      resolve(metadata?.format?.duration || 0);
    });
  });
};

const trimAndResizeVideo = (
  inputPath: string,
  outputPath: string,
  duration: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setDuration(duration) // ✅ Force trim
      .outputOptions([
        `-t ${duration}`,
        "-vf scale=1080:1920", // HD vertical
        "-c:v libx264",
        "-preset medium",      // Better quality
        "-crf 21",             // Higher quality
        "-threads 4",          // Use more cores
        "-bufsize 2M"          // Bigger buffer
      ])
      
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });
};

const mergeVideos = (
  fileListPath: string,
  outputPath: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    fs.chmodSync(outputDir, 0o777);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

    ffmpeg()
      .input(fileListPath)
      .inputOptions(["-f concat", "-safe 0"])
      .outputOptions([
        "-c:v libx264",
        "-preset veryfast",
        "-crf 23",
        "-vf fps=30,format=yuv420p",
        "-movflags +faststart",
      ])
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });
};

const addMusicToVideo = (
  videoPath: string,
  audioPath: string,
  outputPath: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const musicDir = path.resolve("./public/music");
    if (!fs.existsSync(musicDir)) fs.mkdirSync(musicDir, { recursive: true });

    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .outputOptions([
        "-c:v copy",
        "-c:a aac",
        "-b:a 192k",
        "-shortest",
        "-movflags +faststart",
      ])
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });
};

const downloadMusicFile = async (url: string, outputPath: string): Promise<void> => {
  const response = await axios({ url, responseType: "stream" });
  const writer = fs.createWriteStream(outputPath);
  await new Promise<void>((resolve, reject) => {
    response.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
};

