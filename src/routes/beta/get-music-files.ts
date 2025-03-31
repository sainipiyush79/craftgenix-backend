import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const musicDir = path.resolve("./public/music");

    if (!fs.existsSync(musicDir)) {
      console.warn("⚠️ Music directory not found:", musicDir);
      res.status(200).json({ files: [] });
      return;
    }

    const files = fs.readdirSync(musicDir).filter((file) => !file.startsWith("."));

    const musicFiles = files.map((file) => ({
      name: file,
      url: `/music/${file}`, // This matches the static serving path
    }));

    res.status(200).json({ files: musicFiles });
  } catch (error) {
    console.error("❌ Error reading music files:", error);
    res.status(500).json({ error: "Failed to fetch music files" });
  }
});

export default router;