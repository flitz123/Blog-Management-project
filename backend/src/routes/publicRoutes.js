import express from "express";
import Subscription from "../models/Subscription.js";
import Category from "../models/Category.js";

const router = express.Router();
router.get("/categories", async (_req, res, next) => { try { res.json(await Category.find().sort({ name: 1 })); } catch (error) { next(error); } });
router.post("/subscribe", async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: "A valid email is required" });
    await Subscription.findOneAndUpdate({ email }, { email, active: true }, { upsert: true, new: true });
    res.status(201).json({ message: "You are subscribed" });
  } catch (error) { next(error); }
});
export default router;
