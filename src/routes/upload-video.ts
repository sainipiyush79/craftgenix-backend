import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import formidable from "formidable";

const router = express.Router();

// ✅ Disable body parsing (like `bodyParser: false` in Next.js)
export const config = {
  api: { bodyParser: false },
};

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const outputDir = path.resolve("./public/videos/content-recorder");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const form = formidable({
    uploadDir: outputDir,
    keepExtensions: true,
    maxFileSize: 100 * 1024 * 1024, // 100MB
    filename: (_name, _ext, part) => {
      return part.originalFilename || "recorded.mp4";
    },
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("❌ File upload error:", err);
      res.status(500).json({ error: "Error uploading video" });
      return;
    }

    const uploadedFile = Array.isArray(files.video) ? files.video[0] : files.video;
    if (!uploadedFile) {
      res.status(400).json({ error: "No video file uploaded" });
      return;
    }

    const finalPath = path.join(outputDir, "recorded.mp4");
    fs.renameSync(uploadedFile.filepath, finalPath);

    console.log("✅ Recorded video saved successfully:", finalPath);
    res.status(200).json({ uploadedVideoUrl: "/videos/content-recorder/recorded.mp4" });
  });
});

export default router;
