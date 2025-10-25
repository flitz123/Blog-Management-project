import express from "express";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all posts
router.get("/", async (req, res) => {
  const posts = await Post.find().populate("author", "username").sort({ createdAt: -1 });
  res.json(posts);
});

// Get a single post
router.get("/:id", async (req, res) => {
  const post = await Post.findById(req.params.id).populate("author", "username").populate({
    path: "comments",
    populate: { path: "author", select: "username" },
  });
  res.json(post);
});

// Create post
router.post("/", protect, async (req, res) => {
  const { title, content } = req.body;
  const post = await Post.create({ title, content, author: req.user._id });
  res.status(201).json(post);
});

// Add comment
router.post("/:id/comments", protect, async (req, res) => {
  const { text } = req.body;
  const comment = await Comment.create({
    text,
    author: req.user._id,
    post: req.params.id,
  });

  await Post.findByIdAndUpdate(req.params.id, { $push: { comments: comment._id } });
  res.status(201).json(comment);
});

export default router;
