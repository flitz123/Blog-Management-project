import express from "express";
import User from "../models/User.js";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import Category from "../models/Category.js";
import Subscription from "../models/Subscription.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect, authorize("admin"));

router.get("/overview", async (_req, res, next) => {
  try {
    const [users, posts, comments, views, popularPosts] = await Promise.all([
      User.countDocuments(), Post.countDocuments(), Comment.countDocuments(), Post.aggregate([{ $group: { _id: null, views: { $sum: "$views" } } }]),
      Post.find({ status: "published" }).sort({ views: -1 }).limit(5).select("title views likes"),
    ]);
    res.json({ users, posts, comments, views: views[0]?.views || 0, popularPosts });
  } catch (error) { next(error); }
});

router.get("/users", async (_req, res, next) => { try { res.json(await User.find().select("-password").sort({ createdAt: -1 })); } catch (error) { next(error); } });
router.patch("/users/:id", async (req, res, next) => {
  try {
    if (!["reader", "author", "admin"].includes(req.body.role)) return res.status(400).json({ message: "Invalid user role" });
    if (req.params.id === req.user._id.toString() && req.body.role !== "admin") return res.status(400).json({ message: "You cannot remove your own admin role" });
    const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true, runValidators: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) { next(error); }
});
router.delete("/users/:id", async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) return res.status(400).json({ message: "You cannot delete your own account here" });
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (error) { next(error); }
});
router.get("/comments", async (_req, res, next) => { try { res.json(await Comment.find({ status: { $in: ["pending", "flagged"] } }).populate("author", "name").populate("post", "title").sort({ createdAt: -1 })); } catch (error) { next(error); } });
router.patch("/comments/:id", async (req, res, next) => {
  try {
    if (!["approved", "flagged", "removed"].includes(req.body.status)) return res.status(400).json({ message: "Invalid comment status" });
    const comment = await Comment.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    res.json(comment);
  } catch (error) { next(error); }
});
router.get("/categories", async (_req, res, next) => { try { res.json(await Category.find().populate("parent", "name").sort({ name: 1 })); } catch (error) { next(error); } });
router.post("/categories", async (req, res, next) => { try { const name = req.body.name?.trim(); if (!name) return res.status(400).json({ message: "Category name is required" }); res.status(201).json(await Category.create({ name, description: req.body.description || "" })); } catch (error) { next(error); } });
router.delete("/categories/:id", async (req, res, next) => { try { await Category.findByIdAndDelete(req.params.id); res.json({ message: "Category deleted" }); } catch (error) { next(error); } });
router.get("/subscriptions", async (_req, res, next) => { try { res.json(await Subscription.find().sort({ createdAt: -1 })); } catch (error) { next(error); } });

export default router;
