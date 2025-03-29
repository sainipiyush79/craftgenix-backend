// src/utils/mergeFaceCam.ts
import { exec } from "child_process";

export async function mergeFaceCamWithVideo(mainVideo: string, faceVideo: string, outputPath: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const ffmpegCommand = `
      ffmpeg -i "${mainVideo}" -i "${faceVideo}" -filter_complex "[0:v]scale=1080:1280[top];[1:v]scale=1080:640[bottom];[top][bottom]vstack" -c:v libx264 -preset fast -crf 23 -y "${outputPath}"
    `;

    exec(ffmpegCommand, (error, _stdout, stderr) => {
      if (error) {
        console.error("❌ FFmpeg Merge Error:", stderr);
        reject(false);
      } else {
        console.log("✅ Successfully merged AI video & face cam!");
        resolve(true);
      }
    });
  });
}
