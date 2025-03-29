import { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";
import formidable, { File } from "formidable";
import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: false, // ✅ Required for handling file uploads
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // ✅ Get token from request headers
    const accessToken = req.headers.authorization?.replace("Bearer ", "");

    if (!accessToken || accessToken.length < 30) {
      console.error("❌ No valid access token received.");
      return res.status(401).json({ error: "Unauthorized. Please connect YouTube." });
    }

    console.log("✅ Received YouTube Access Token:", accessToken);

    // ✅ Initialize OAuth2 Client with the Access Token
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    // ✅ Ensure Upload Directory Exists
    const uploadDir = path.resolve("./public/uploads/");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // ✅ Correct Formidable Parsing with Proper Typing
    const parseForm = (req: NextApiRequest) =>
      new Promise<{ fields: Record<string, string | string[]>; files: formidable.Files }>((resolve, reject) => {
        const form = formidable({
          multiples: false,
          maxFiles: 1,
          maxFileSize: 100 * 1024 * 1024, // 100MB limit
          allowEmptyFiles: false,
          uploadDir: uploadDir,
          keepExtensions: true,
        });

        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
        
          // ✅ Ensure fields is correctly typed as Record<string, string | string[]>
          const typedFields: Record<string, string | string[]> = Object.fromEntries(
            Object.entries(fields).map(([key, value]) => [
              key,
              Array.isArray(value) ? value.map(v => String(v)) : String(value),
            ])
          );
        
          resolve({ fields: typedFields, files });
        });
        
      });

    const { fields, files } = await parseForm(req);

    // ✅ Ensure we have a video file
    const videoFile = files.video as File | File[] | undefined;
    if (!videoFile) {
      return res.status(400).json({ error: "No video file provided" });
    }

    const file = Array.isArray(videoFile) ? videoFile[0] : videoFile;
    if (!file || !file.filepath) {
      return res.status(400).json({ error: "Invalid file uploaded" });
    }

    console.log("✅ File Uploaded:", file.filepath);

    // ✅ Type-Safe Handling of Tags, Title, Description
    const tags: string[] = (() => {
      if (!fields.tags) return ["AI", "Tech"]; // Default tags if none provided
      if (Array.isArray(fields.tags)) {
        return fields.tags.flatMap(tag => (typeof tag === "string" ? tag.split(",").map(t => t.trim()) : []));
      }
      if (typeof fields.tags === "string") {
        return fields.tags.split(",").map(tag => tag.trim());
      }
      return ["AI", "Tech"];
    })();

    const title: string = Array.isArray(fields.title) ? fields.title[0] : fields.title || "My YouTube Shorts";
    const description: string = Array.isArray(fields.description) ? fields.description[0] : fields.description || "Uploaded via AlgoYogi";
    const privacyStatus: string = Array.isArray(fields.privacy) ? fields.privacy[0] : fields.privacy || "private";

    console.log("🎥 Uploading Video:", { title, description, tags, privacyStatus });

    // ✅ Upload Video to YouTube
    const uploadResponse = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title,
          description,
          tags,
          categoryId: "28", // Tech Category
        },
        status: {
          privacyStatus,
        },
      },
      media: {
        body: fs.createReadStream(file.filepath),
      },
    });

    console.log("✅ Video uploaded successfully:", uploadResponse.data);
    res.status(200).json({ success: true, videoId: uploadResponse.data.id });

    // ✅ Cleanup Temporary File
    fs.unlinkSync(file.filepath);
  } catch (error) {
    console.error("❌ Error uploading to YouTube:", error);
    res.status(500).json({ error: "Failed to upload video" });
  }
};
