
import express, { Request, Response } from "express";
import fs from "fs";

const router = express.Router();

// Utility Function
function generateSRT(text: string, outputPath: string) {
  const words = text.split(" ");
  let srtContent = "";
  let startTime = 0;

  words.forEach((word, index) => {
    const endTime = startTime + 1;
    srtContent += `${index + 1}\n00:00:${startTime},000 --> 00:00:${endTime},000\n${word}\n\n`;
    startTime = endTime;
  });

  fs.writeFileSync(outputPath, srtContent);
  console.log(`✅ SRT file saved: ${outputPath}`);
}

// Express route
router.post("/", (req: any, res: any) => {
  const { text, outputPath } = req.body;

  if (!text || !outputPath) {
    return res.status(400).json({ success: false, message: "Missing input" });
  }

  try {
    generateSRT(text, outputPath);
    res.status(200).json({ success: true, message: "SRT generated." });
  } catch (error) {
    console.error("❌ generateSRT error:", error);
    res.status(500).json({ success: false, message: "Failed to generate SRT." });
  }
});

// ✅ EXPORT ROUTER not the function directly
export default router;
