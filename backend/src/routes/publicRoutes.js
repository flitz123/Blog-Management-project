import express from "express";
import { getSupabase, unwrap } from "../config/db.js";
import { mapCategory } from "../utils/serializers.js";

const router = express.Router();

router.get("/categories", async (_req, res, next) => {
  try {
    const categories = unwrap(await getSupabase().from("categories").select("*").order("name"));
    res.json(categories.map(mapCategory));
  } catch (error) {
    next(error);
  }
});

router.post("/subscribe", async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: "A valid email is required" });
    unwrap(await getSupabase()
      .from("subscriptions")
      .upsert({ email, active: true, updated_at: new Date().toISOString() }, { onConflict: "email" }));
    res.status(201).json({ message: "You are subscribed" });
  } catch (error) {
    next(error);
  }
});

export default router;
