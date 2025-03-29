// import express from "express";
// import dotenv from "dotenv";
// import cors from "cors";

// dotenv.config();
// const app = express();
// app.use(cors());
// app.use(express.json());

// /* -------------------- AI ROUTES -------------------- */
// import generateScriptAI from "./routes/ai/generate-script";
// import generateVideoAI from "./routes/ai/generate-video";
// import generateVoiceAI from "./routes/ai/generate-voice";
// import generateSRT from "./routes/ai/generateSRT";
// import trendingTopics from "./routes/ai/trending-topics";
// import fetchStockVideoRoute from "./routes/ai/fetchStockVideo"; // ✅ renamed
// import scriptPhysics from "./routes/ai/script-physics";

// // ai/scripts
// import healthScript from "./routes/ai/scripts/health-script";
// import scienceScript from "./routes/ai/scripts/science-script";
// import techScript from "./routes/ai/scripts/tech-script";

// /* -------------------- ANIME ROUTES -------------------- */
// import generateVideoAnime from "./routes/anime/generate-video";
// import generateVoiceAnime from "./routes/anime/generate-voice";
// import generateScenes from "./routes/anime/generate-scenes";
// import fetchImage from "./routes/anime/fetch-image";
// import animateImage from "./routes/anime/animate-image";

// /* -------------------- BETA ROUTES -------------------- */
// import fetchVideosBeta from "./routes/beta/fetch-videos";
// import generateScriptBeta from "./routes/beta/generate-script";
// import getMusicFilesBeta from "./routes/beta/get-music-files";
// import mergeVideosBeta from "./routes/beta/merge-videos";
// import videoMetadataBeta from "./routes/beta/video-metadata";

// /* -------------------- MISC / MAIN ROUTES -------------------- */
// import combineVideos from "./routes/combine-videos";
// import fetchVideos from "./routes/fetch-videos";
// import finalMerge from "./routes/final-merge";
// import mergeFaceCamWithVideo from "./routes/generate-video";
// import mergeVideos from "./routes/merge-videos";
// import uploadAudio from "./routes/upload-audio";
// import uploadVideo from "./routes/upload-video";
// import uploadYouTube from "./routes/upload-youtube";
// import videoMetadata from "./routes/video-metadata";

// /* -------------------- Mount Endpoints -------------------- */
// // AI
// app.use("/api/ai/generate-script", generateScriptAI);
// app.use("/api/ai/generate-video", generateVideoAI);
// app.use("/api/ai/generate-voice", generateVoiceAI);
// app.use("/api/ai/generate-srt", generateSRT);
// app.use("/api/ai/trending-topics", trendingTopics);
// app.use("/api/ai/fetch-stock-video", fetchStockVideoRoute); // ✅ fixed
// app.use("/api/ai/script-physics", scriptPhysics);
// app.use("/api/ai/health-script", healthScript);
// app.use("/api/ai/science-script", scienceScript);
// app.use("/api/ai/tech-script", techScript);

// // Anime
// app.use("/api/anime/generate-video", generateVideoAnime);
// app.use("/api/anime/generate-voice", generateVoiceAnime);
// app.use("/api/anime/generate-scenes", generateScenes);
// app.use("/api/anime/fetch-image", fetchImage);
// app.use("/api/anime/animate-image", animateImage);

// // Beta
// app.use("/api/beta/fetch-videos", fetchVideosBeta);
// app.use("/api/beta/generate-script", generateScriptBeta);
// app.use("/api/beta/get-music-files", getMusicFilesBeta);
// app.use("/api/beta/merge-videos", mergeVideosBeta);
// app.use("/api/beta/video-metadata", videoMetadataBeta);

// // Misc
// app.use("/api/combine-videos", combineVideos);
// app.use("/api/fetch-videos", fetchVideos);
// app.use("/api/final-merge", finalMerge);
// app.use("/api/generate-video", mergeFaceCamWithVideo);
// app.use("/api/merge-videos", mergeVideos);
// app.use("/api/upload-audio", uploadAudio);
// app.use("/api/upload-video", uploadVideo);
// app.use("/api/upload-youtube", uploadYouTube);
// app.use("/api/video-metadata", videoMetadata);

// // Start server
// const PORT = process.env.PORT || 5001;
// app.listen(PORT, () => {
//   console.log(`🚀 CraftGenix Backend running on http://localhost:${PORT}`);
// });
