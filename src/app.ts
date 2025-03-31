import express from "express";
import dotenv from "dotenv";
import cors from "cors";


import jamendoMusic from "./routes/music/free-music";
import uploadMusicRoute from "./routes/music/upload";


import generateScript from "./routes/beta/generate-script";
import fetchVideosBeta from "./routes/beta/fetch-videos";
import mergeVideosRouteBeta from "./routes/beta/merge-videos";
import mergeVideosOptimizedRouteBeta from "./routes/beta/merge-videos-optimized";
import getMusicFilesRoute from "./routes/beta/get-music-files";
import generateVideoMetadata from "./routes/beta/video-metadata";
import trendingTopicsRoute from "./routes/ai/trending-topics";


import healthScript from "./routes/ai/scripts/health-script";
import scienceScript from "./routes/ai/scripts/science-script";
import techScript from "./routes/ai/scripts/tech-script";

import fetchVideos from "./routes/fetch-videos";
import mergeVideosRoute from "./routes/merge-videos";
import uploadVideoRoute from "./routes/upload-video";
import finalMergeRoute from "./routes/final-merge";
import cleanupRouteRec from "./routes/cleanup-recorder";
import cleanupRouteGen from "./routes/cleanup-generator";








dotenv.config();

const app = express();

// Allow origin from instantrix.com
const allowedOrigins = [
  "http://localhost:3000",
  "https://www.instantrix.com"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  })
);


app.use(express.json());

//main
app.use("/api/fetch-videos", fetchVideos);
app.use("/api/merge-videos", mergeVideosRoute);
app.use("/api/upload-video", uploadVideoRoute);
app.use("/api/final-merge", finalMergeRoute);
app.use("/api/cleanup-recorder", cleanupRouteRec);
app.use("/api/cleanup-generator", cleanupRouteGen);

// Beta API's 
app.use("/api/beta/generate-script", generateScript);
app.use("/api/beta/fetch-videos", fetchVideosBeta);
app.use("/api/beta/merge-videos", mergeVideosRouteBeta);
app.use("/api/beta/merge-videos-optimized", mergeVideosOptimizedRouteBeta);
app.use("/api/beta/get-music-files", getMusicFilesRoute);
app.use("/api/beta/video-metadata", generateVideoMetadata);


//ai API's 
app.use("/api/ai/trending-topics", trendingTopicsRoute);
app.use("/api/ai/scripts/health-script", healthScript);
app.use("/api/ai/scripts/science-script", scienceScript);
app.use("/api/ai/scripts/tech-script", techScript);


//music
app.use("/api/music/free-music", jamendoMusic);
app.use("/api/music/upload", uploadMusicRoute);



app.use("/videos", express.static("public/videos"));
app.use("/videos", express.static("public/videos/content-recorder"));
app.use("/music", express.static("public/music"));




const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Backend is running on http://localhost:${PORT}`);
});
