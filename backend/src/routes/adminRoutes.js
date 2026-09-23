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
router.patch("/users/:id", async (req, res, next) => { try { const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true }).select("-password"); res.json(user); } catch (error) { next(error); } });
router.delete("/users/:id", async (req, res, next) => { try { await User.findByIdAndDelete(req.params.id); res.json({ message: "User deleted" }); } catch (error) { next(error); } });
router.get("/comments", async (_req, res, next) => { try { res.json(await Comment.find({ status: { $in: ["pending", "flagged"] } }).populate("author", "name").populate("post", "title").sort({ createdAt: -1 })); } catch (error) { next(error); } });
router.patch("/comments/:id", async (req, res, next) => { try { res.json(await Comment.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true })); } catch (error) { next(error); } });
router.get("/categories", async (_req, res, next) => { try { res.json(await Category.find().populate("parent", "name").sort({ name: 1 })); } catch (error) { next(error); } });
router.post("/categories", async (req, res, next) => { try { res.status(201).json(await Category.create(req.body)); } catch (error) { next(error); } });
router.delete("/categories/:id", async (req, res, next) => { try { await Category.findByIdAndDelete(req.params.id); res.json({ message: "Category deleted" }); } catch (error) { next(error); } });
router.get("/subscriptions", async (_req, res, next) => { try { res.json(await Subscription.find().sort({ createdAt: -1 })); } catch (error) { next(error); } });

export default router;
