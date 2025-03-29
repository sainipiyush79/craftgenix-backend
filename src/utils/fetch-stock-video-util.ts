import path from "path";
import axios from "axios";
import fs from "fs";
import { exec } from "child_process";


// Utility Function
export async function fetchStockVideo(topic: string): Promise<string | null> {
    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) {
      console.error("❌ Missing Pexels API Key. Ensure .env.local is set correctly.");
      return null;
    }
  
    try {
      const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(topic)}&per_page=5`;
      const response = await axios.get(url, { headers: { Authorization: apiKey } });
  
      if (response.status !== 200) {
        console.error(`❌ Pexels API Error: ${response.status}`, response.data);
        return null;
      }
  
      const video = response.data.videos?.find((v: any) => v.video_files.length > 0);
      if (!video) {
        console.warn("⚠️ No suitable stock video found.");
        return null;
      }
  
      const videoFile = video.video_files.find(
        (file: any) => file.width >= 1280 && file.file_type === "video/mp4"
      ) || video.video_files[0];
  
      if (!videoFile?.link) {
        console.warn("⚠️ No valid video file found.");
        return null;
      }
  
      console.log(`✅ Selected stock video: ${videoFile.link}`);
  
      const videosDir = path.resolve("./public/videos");
      if (!fs.existsSync(videosDir)) {
        fs.mkdirSync(videosDir, { recursive: true });
      }
  
      const rawVideoPath = path.join(videosDir, `${topic.replace(/\s+/g, "_")}_raw.mp4`);
      const finalVideoPath = path.join(videosDir, `${topic.replace(/\s+/g, "_")}.mp4`);
  
      const videoResponse = await axios.get(videoFile.link, { responseType: "stream" });
      const writer = fs.createWriteStream(rawVideoPath);
  
      return new Promise((resolve, reject) => {
        videoResponse.data.pipe(writer);
        writer.on("finish", () => {
          const ffmpegCommand = `
            ffmpeg -i "${rawVideoPath}" -vf "crop=ih*9/16:ih,scale=1080:1920" -c:v libx264 -preset fast -crf 23 -y "${finalVideoPath}"
          `;
          exec(ffmpegCommand, (error, _stdout, stderr) => {
            if (error) {
              console.error("❌ FFmpeg Conversion Error:", stderr);
              reject(null);
            } else {
              console.log("✅ Video converted to vertical format:", finalVideoPath);
              fs.unlinkSync(rawVideoPath);
              resolve(finalVideoPath);
            }
          });
        });
        writer.on("error", reject);
      });
    } catch (error: any) {
      console.error("❌ Error fetching stock video:", error.response?.status, error.response?.data || error.message);
      return null;
    }
  }
  