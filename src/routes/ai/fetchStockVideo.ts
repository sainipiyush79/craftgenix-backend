import express from "express";
import type { Request, Response } from "express";
import { fetchStockVideo } from "../../utils/fetch-stock-video-util";

const router = express.Router();

router.post("/", async function (req: any, res: any) {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ success: false, message: "Missing 'topic'" });

  try {
    const videoPath = await fetchStockVideo(topic);
    if (videoPath) {
      res.status(200).json({ success: true, videoPath });
    } else {
      res.status(500).json({ success: false, message: "Failed to fetch stock video." });
    }
  } catch (err) {
    console.error("❌ Error in fetch-stock-video route:", err);
    res.status(500).json({ success: false, message: "Unexpected error." });
  }
});

export default router;
