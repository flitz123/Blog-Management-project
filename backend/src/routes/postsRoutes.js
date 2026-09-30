import express from "express";
import mongoose from "mongoose";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import { protect, optionalAuth, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();
const canEdit = (post, user) => post.author.toString() === user._id.toString() || user.role === "admin";
const isFutureDate = (value) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date > new Date();
};

router.get("/", async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, category, tag } = req.query;
    const filter = { status: "published" };
    if (search) filter.$text = { $search: search };
    if (category) filter.category = category;
    if (tag) filter.tags = tag;
    const [posts, total] = await Promise.all([
      Post.find(filter).populate("author", "name bio").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      Post.countDocuments(filter),
    ]);
    res.json({ posts, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) { next(error); }
});

router.get("/mine", protect, async (req, res, next) => {
  try {
    const posts = await Post.find({ author: req.user._id })
      .sort({ updatedAt: -1 });
    res.json(posts);
  } catch (error) { next(error); }
});

router.get("/:id/manage", protect, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (!canEdit(post, req.user)) return res.status(403).json({ message: "Not authorized" });
    res.json(post);
  } catch (error) { next(error); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const identifier = mongoose.isValidObjectId(req.params.id) ? { _id: req.params.id } : { slug: req.params.id };
    const post = await Post.findOneAndUpdate({ ...identifier, status: "published" }, { $inc: { views: 1 } }, { new: true })
      .populate("author", "name bio avatar")
      .populate({ path: "comments", match: { status: "approved" }, populate: { path: "author", select: "name" } });
    if (!post) return res.status(404).json({ message: "Published post not found" });
    res.json(post);
  } catch (error) { next(error); }
});

router.post("/", protect, authorize("author", "admin"), async (req, res, next) => {
  try {
    const { title, content, tags = [], coverImage = "", category, subcategory, status = "draft", excerpt, scheduledAt, slug, metaTitle, metaDescription } = req.body;
    if (!title?.trim() || !content?.trim()) return res.status(400).json({ message: "Title and content are required" });
    if (!["draft", "scheduled", "published", "archived"].includes(status)) return res.status(400).json({ message: "Invalid post status" });
    if (status === "scheduled" && !isFutureDate(scheduledAt)) return res.status(400).json({ message: "Choose a future publication date" });
    const post = await Post.create({ title: title.trim(), content, excerpt, tags, coverImage, category, subcategory, status, scheduledAt: status === "scheduled" ? scheduledAt : null, slug, metaTitle, metaDescription, author: req.user._id });
    res.status(201).json(post);
  } catch (error) { next(error); }
});

router.patch("/:id", protect, authorize("author", "admin"), async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (!canEdit(post, req.user)) return res.status(403).json({ message: "Not authorized" });
    const allowed = ["title", "content", "excerpt", "tags", "coverImage", "category", "subcategory", "status", "scheduledAt", "slug", "metaTitle", "metaDescription"];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    if (updates.status && !["draft", "scheduled", "published", "archived"].includes(updates.status)) return res.status(400).json({ message: "Invalid post status" });
    const nextStatus = updates.status || post.status;
    const nextScheduledAt = updates.scheduledAt ?? post.scheduledAt;
    if (nextStatus === "scheduled" && !isFutureDate(nextScheduledAt)) return res.status(400).json({ message: "Choose a future publication date" });
    if (nextStatus !== "scheduled") updates.scheduledAt = null;
    if (updates.title || updates.content) post.revisions.push({ title: post.title, content: post.content });
    Object.assign(post, updates);
    await post.save();
    res.json(post);
  } catch (error) { next(error); }
});

router.delete("/:id", protect, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (!canEdit(post, req.user)) return res.status(403).json({ message: "Not authorized" });
    await Comment.deleteMany({ post: post._id });
    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (error) { next(error); }
});

router.post("/:id/like", protect, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.status !== "published") return res.status(404).json({ message: "Published post not found" });
    const liked = post.likes.some((id) => id.toString() === req.user._id.toString());
    post.likes = liked ? post.likes.filter((id) => id.toString() !== req.user._id.toString()) : [...post.likes, req.user._id];
    await post.save();
    res.json({ liked: !liked, likes: post.likes.length });
  } catch (error) { next(error); }
});

router.post("/:id/comments", optionalAuth, async (req, res, next) => {
  try {
    const { text, parent, guestName } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Comment text is required" });
    if (!req.user && !guestName?.trim()) return res.status(400).json({ message: "Your name is required for a guest comment" });
    const post = await Post.findOne({ _id: req.params.id, status: "published" });
    if (!post) return res.status(404).json({ message: "Published post not found" });
    if (parent) {
      const parentComment = await Comment.findOne({ _id: parent, post: post._id, status: "approved" });
      if (!parentComment) return res.status(400).json({ message: "Reply target is invalid" });
    }
    const isAuthor = req.user && req.user._id.toString() === post.author.toString();
    const comment = await Comment.create({ text: text.trim(), author: req.user?._id, guestName: req.user ? "" : guestName.trim(), post: post._id, parent, status: req.user && (req.user.role === "admin" || isAuthor) ? "approved" : "pending" });
    post.comments.push(comment._id);
    await post.save();
    res.status(201).json(comment);
  } catch (error) { next(error); }
});

router.delete("/:postId/comments/:commentId", protect, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId).populate("post", "author");
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.post._id.toString() !== req.params.postId) return res.status(404).json({ message: "Comment not found" });
    if (comment.author?.toString() !== req.user._id.toString() && req.user.role !== "admin" && comment.post.author.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Not authorized" });
    await comment.deleteOne();
    await Post.findByIdAndUpdate(req.params.postId, { $pull: { comments: comment._id } });
    res.json({ message: "Comment deleted" });
  } catch (error) { next(error); }
});

router.patch("/:postId/comments/:commentId", protect, authorize("admin"), async (req, res, next) => {
  try {
    const comment = await Comment.findByIdAndUpdate(req.params.commentId, { status: req.body.status }, { new: true });
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    res.json(comment);
  } catch (error) { next(error); }
});

export default router;
