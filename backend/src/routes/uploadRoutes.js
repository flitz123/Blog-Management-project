import crypto from "node:crypto";
import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signature", protect, authorize("author", "admin"), (req, res) => {
  const { CLOUDINARY_CLOUD_NAME: cloudName, CLOUDINARY_API_KEY: apiKey, CLOUDINARY_API_SECRET: apiSecret } = process.env;
  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(503).json({ message: "Image uploads are not configured" });
  }

  const params = { folder: "blog-management", timestamp: Math.floor(Date.now() / 1000) };
  const signaturePayload = Object.keys(params).sort().map((key) => `${key}=${params[key]}`).join("&");
  const signature = crypto.createHash("sha1").update(`${signaturePayload}${apiSecret}`).digest("hex");
  res.json({ cloudName, apiKey, signature, ...params });
});

export default router;