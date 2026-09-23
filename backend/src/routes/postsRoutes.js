import express from "express";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();
const canEdit = (post, user) => post.author.toString() === user._id.toString() || user.role === "admin";

router.get("/", async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, category, tag, status } = req.query;
    const filter = { status: status && ["draft", "archived"].includes(status) ? status : "published" };
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

router.get("/:id", async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true })
      .populate("author", "name bio avatar")
      .populate({ path: "comments", match: { status: "approved" }, populate: { path: "author", select: "name" } });
    if (!post || post.status !== "published") return res.status(404).json({ message: "Published post not found" });
    res.json(post);
  } catch (error) { next(error); }
});

router.post("/", protect, async (req, res, next) => {
  try {
    const { title, content, tags = [], coverImage = "", category, subcategory, status = "draft", excerpt } = req.body;
    if (!title?.trim() || !content?.trim()) return res.status(400).json({ message: "Title and content are required" });
    const safeStatus = req.user.role === "admin" ? status : status === "published" ? "draft" : status;
    const post = await Post.create({ title: title.trim(), content, excerpt, tags, coverImage, category, subcategory, status: safeStatus, author: req.user._id });
    res.status(201).json(post);
  } catch (error) { next(error); }
});

router.patch("/:id", protect, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (!canEdit(post, req.user)) return res.status(403).json({ message: "Not authorized" });
    const allowed = ["title", "content", "excerpt", "tags", "coverImage", "category", "subcategory", "status"];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    if (updates.status === "published" && req.user.role !== "admin") updates.status = "draft";
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
    if (!post) return res.status(404).json({ message: "Post not found" });
    const liked = post.likes.some((id) => id.toString() === req.user._id.toString());
    post.likes = liked ? post.likes.filter((id) => id.toString() !== req.user._id.toString()) : [...post.likes, req.user._id];
    await post.save();
    res.json({ liked: !liked, likes: post.likes.length });
  } catch (error) { next(error); }
});

router.post("/:id/comments", protect, async (req, res, next) => {
  try {
    const { text, parent } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Comment text is required" });
    const post = await Post.findOne({ _id: req.params.id, status: "published" });
    if (!post) return res.status(404).json({ message: "Published post not found" });
    const comment = await Comment.create({ text: text.trim(), author: req.user._id, post: post._id, parent, status: req.user.role === "admin" || req.user._id.toString() === post.author.toString() ? "approved" : "pending" });
    post.comments.push(comment._id);
    await post.save();
    res.status(201).json(comment);
  } catch (error) { next(error); }
});

router.delete("/:postId/comments/:commentId", protect, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId).populate("post", "author");
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== "admin" && comment.post.author.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Not authorized" });
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
