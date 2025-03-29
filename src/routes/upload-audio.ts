import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import formidable from "formidable";

export const config = {
  api: {
    bodyParser: false, // Disable default body parsing for file uploads
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const form = formidable({ maxFileSize: 10 * 1024 * 1024 }); // ✅ FIXED: Correct way to initialize formidable

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error("File upload error:", err);
        return res.status(500).json({ error: "Failed to process file." });
      }

      const file = files.audio?.[0]; // Get uploaded audio file
      if (!file) {
        return res.status(400).json({ error: "No audio file uploaded." });
      }

      // Save file to `/public/uploads/`
      const uploadDir = path.resolve("./public/uploads");
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, file.originalFilename || `audio_${Date.now()}.mp3`);
      fs.renameSync(file.filepath, filePath);

      res.status(200).json({ audioUrl: `/uploads/${path.basename(filePath)}` });
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload audio." });
  }
}
