import express, { Request, Response } from "express";
import axios from "axios";

const router = express.Router();

router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const JAMENDO_CLIENT_ID = process.env.JAMENDO_CLIENT_ID;
    if (!JAMENDO_CLIENT_ID) throw new Error("Missing Jamendo API Key");

    const category = req.query.category?.toString() || "pop";
    const search = req.query.search?.toString() || "";

    const params = new URLSearchParams({
      client_id: JAMENDO_CLIENT_ID,
      format: "json",
      limit: "20",
      fuzzytags: category,
      order: "popularity_total",
      include: "musicinfo+licenses",
    });

    if (search) {
      params.append("namesearch", search);
    }

    const apiUrl = `https://api.jamendo.com/v3.0/tracks/?${params.toString()}`;

    console.log("🌐 Fetching Jamendo music from:", apiUrl);

    const response = await axios.get(apiUrl);
    const results = response.data.results;

    console.log("📦 Jamendo Raw Results:", results.length);

    if (!Array.isArray(results) || results.length === 0) {
      console.warn("⚠️ No music found");
      res.status(200).json({ files: [] });
      return;
    }

    const music = results.map((track: any) => ({
      id: track.id || track.audio || Math.random().toString(36).substring(7), // fix for key warning
      name: `${track.artist_name} - ${track.name}` || "Untitled",
      url: track.audio,
      duration: track.duration,
    }));

    res.status(200).json({ files: music });
  } catch (error) {
    console.error("❌ Error fetching music from Jamendo:", error);
    res.status(500).json({ error: "Failed to fetch music from Jamendo." });
  }
});

export default router;
