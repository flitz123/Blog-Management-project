import express from "express";
import { randomUUID } from "node:crypto";
import { getSupabase, unwrap } from "../config/db.js";
import { mapComment, mapPost } from "../utils/serializers.js";
import { protect, optionalAuth, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (value) => UUID_PATTERN.test(value);
const canEdit = (post, user) => post.author_id === user.id || user.role === "admin";
const isFutureDate = (value) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date > new Date();
};
const makeSlug = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const postSelect = "*, author:users!posts_author_id_fkey(id, name, bio, avatar)";

router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const { search, category, tag } = req.query;
    let query = getSupabase()
      .from("posts")
      .select(postSelect, { count: "exact" })
      .eq("status", "published");
    if (typeof search === "string" && search.trim()) query = query.textSearch("search_vector", search.trim(), { type: "websearch" });
    if (typeof category === "string" && category) query = query.eq("category", category);
    if (typeof tag === "string" && tag) query = query.contains("tags", [tag]);

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    if (error) throw error;
    const posts = data.map((post) => mapPost(post));
    res.json({ posts, total: count ?? 0, page, pages: Math.ceil((count ?? 0) / limit) });
  } catch (error) {
    next(error);
  }
});

router.get("/mine", protect, async (req, res, next) => {
  try {
    const posts = unwrap(await getSupabase()
      .from("posts")
      .select("*")
      .eq("author_id", req.user.id)
      .order("updated_at", { ascending: false }));
    res.json(posts.map((post) => mapPost(post)));
  } catch (error) {
    next(error);
  }
});

router.get("/:id/manage", protect, async (req, res, next) => {
  try {
    if (!isUuid(req.params.id)) return res.status(404).json({ message: "Post not found" });
    const post = unwrap(await getSupabase().from("posts").select("*").eq("id", req.params.id).maybeSingle());
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (!canEdit(post, req.user)) return res.status(403).json({ message: "Not authorized" });
    res.json(mapPost(post));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    let query = getSupabase().from("posts").select(postSelect).eq("status", "published");
    query = isUuid(req.params.id) ? query.eq("id", req.params.id) : query.eq("slug", req.params.id);
    const post = unwrap(await query.maybeSingle());
    if (!post) return res.status(404).json({ message: "Published post not found" });

    const views = unwrap(await getSupabase().rpc("increment_post_views", { target_post_id: post.id }));
    const [comments, likes] = await Promise.all([
      getSupabase()
        .from("comments")
        .select("*, author:users!comments_author_id_fkey(id, name)")
        .eq("post_id", post.id)
        .eq("status", "approved")
        .order("created_at"),
      getSupabase().from("post_likes").select("user_id").eq("post_id", post.id),
    ]);
    const commentRows = unwrap(comments);
    const likeRows = unwrap(likes);
    res.json(mapPost({ ...post, views }, {
      author: post.author,
      comments: commentRows,
      likes: likeRows,
    }));
  } catch (error) {
    next(error);
  }
});

router.post("/", protect, authorize("author", "admin"), async (req, res, next) => {
  try {
    const {
      title, content, tags = [], coverImage = "", category, subcategory,
      status = "draft", excerpt, scheduledAt, slug, metaTitle, metaDescription,
    } = req.body;
    if (typeof title !== "string" || !title.trim() || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ message: "Title and content are required" });
    }
    if (!["draft", "scheduled", "published", "archived"].includes(status)) return res.status(400).json({ message: "Invalid post status" });
    if (status === "scheduled" && !isFutureDate(scheduledAt)) return res.status(400).json({ message: "Choose a future publication date" });
    if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== "string")) return res.status(400).json({ message: "Tags must be a list of strings" });

    const id = randomUUID();
    const generatedSlug = `${makeSlug(title) || "post"}-${id.slice(-6)}`;
    const post = unwrap(await getSupabase()
      .from("posts")
      .insert({
        id,
        title: title.trim(),
        content,
        excerpt: excerpt || "",
        tags,
        cover_image: coverImage || "",
        category: category || "Uncategorized",
        subcategory: subcategory || "",
        status,
        scheduled_at: status === "scheduled" ? scheduledAt : null,
        slug: slug ? makeSlug(String(slug)) || generatedSlug : generatedSlug,
        meta_title: metaTitle || "",
        meta_description: metaDescription || "",
        author_id: req.user.id,
      })
      .select("*")
      .single());
    res.status(201).json(mapPost(post));
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", protect, authorize("author", "admin"), async (req, res, next) => {
  try {
    if (!isUuid(req.params.id)) return res.status(404).json({ message: "Post not found" });
    const post = unwrap(await getSupabase().from("posts").select("*").eq("id", req.params.id).maybeSingle());
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (!canEdit(post, req.user)) return res.status(403).json({ message: "Not authorized" });

    const allowed = {
      title: "title",
      content: "content",
      excerpt: "excerpt",
      tags: "tags",
      coverImage: "cover_image",
      category: "category",
      subcategory: "subcategory",
      status: "status",
      scheduledAt: "scheduled_at",
      slug: "slug",
      metaTitle: "meta_title",
      metaDescription: "meta_description",
    };
    const updates = Object.fromEntries(
      Object.entries(req.body)
        .filter(([key]) => Object.hasOwn(allowed, key))
        .map(([key, value]) => [allowed[key], value])
    );
    if (updates.title !== undefined && (typeof updates.title !== "string" || !updates.title.trim())) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (updates.content !== undefined && (typeof updates.content !== "string" || !updates.content.trim())) {
      return res.status(400).json({ message: "Content is required" });
    }
    if (updates.status && !["draft", "scheduled", "published", "archived"].includes(updates.status)) {
      return res.status(400).json({ message: "Invalid post status" });
    }
    if (updates.tags && (!Array.isArray(updates.tags) || updates.tags.some((tag) => typeof tag !== "string"))) {
      return res.status(400).json({ message: "Tags must be a list of strings" });
    }
    const nextStatus = updates.status || post.status;
    const nextScheduledAt = updates.scheduled_at ?? post.scheduled_at;
    if (nextStatus === "scheduled" && !isFutureDate(nextScheduledAt)) return res.status(400).json({ message: "Choose a future publication date" });
    if (nextStatus !== "scheduled") updates.scheduled_at = null;
    if (updates.title !== undefined) updates.title = updates.title.trim();
    if (updates.slug !== undefined) updates.slug = makeSlug(String(updates.slug)) || `${makeSlug(updates.title || post.title) || "post"}-${post.id.slice(-6)}`;
    if (updates.title !== undefined || updates.content !== undefined) {
      updates.revisions = [...(post.revisions || []), {
        title: post.title,
        content: post.content,
        savedAt: new Date().toISOString(),
      }];
    }
    updates.updated_at = new Date().toISOString();
    const updated = unwrap(await getSupabase()
      .from("posts")
      .update(updates)
      .eq("id", post.id)
      .select("*")
      .single());
    res.json(mapPost(updated));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", protect, async (req, res, next) => {
  try {
    if (!isUuid(req.params.id)) return res.status(404).json({ message: "Post not found" });
    const post = unwrap(await getSupabase().from("posts").select("*").eq("id", req.params.id).maybeSingle());
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (!canEdit(post, req.user)) return res.status(403).json({ message: "Not authorized" });
    unwrap(await getSupabase().from("posts").delete().eq("id", post.id));
    res.json({ message: "Post deleted" });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/like", protect, async (req, res, next) => {
  try {
    if (!isUuid(req.params.id)) return res.status(404).json({ message: "Published post not found" });
    const post = unwrap(await getSupabase().from("posts").select("id, status").eq("id", req.params.id).maybeSingle());
    if (!post || post.status !== "published") return res.status(404).json({ message: "Published post not found" });
    const existing = unwrap(await getSupabase()
      .from("post_likes")
      .select("user_id")
      .eq("post_id", post.id)
      .eq("user_id", req.user.id)
      .maybeSingle());
    if (existing) {
      unwrap(await getSupabase().from("post_likes").delete().eq("post_id", post.id).eq("user_id", req.user.id));
    } else {
      unwrap(await getSupabase().from("post_likes").insert({ post_id: post.id, user_id: req.user.id }));
    }
    const likes = unwrap(await getSupabase().from("post_likes").select("user_id").eq("post_id", post.id));
    res.json({ liked: !existing, likes: likes.length });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/comments", optionalAuth, async (req, res, next) => {
  try {
    const { text, parent, guestName } = req.body;
    if (typeof text !== "string" || !text.trim()) return res.status(400).json({ message: "Comment text is required" });
    if (!req.user && (typeof guestName !== "string" || !guestName.trim())) {
      return res.status(400).json({ message: "Your name is required for a guest comment" });
    }
    if (!isUuid(req.params.id)) return res.status(404).json({ message: "Published post not found" });
    const post = unwrap(await getSupabase()
      .from("posts")
      .select("id, author_id")
      .eq("id", req.params.id)
      .eq("status", "published")
      .maybeSingle());
    if (!post) return res.status(404).json({ message: "Published post not found" });
    if (parent) {
      if (!isUuid(parent)) return res.status(400).json({ message: "Reply target is invalid" });
      const parentComment = unwrap(await getSupabase()
        .from("comments")
        .select("id")
        .eq("id", parent)
        .eq("post_id", post.id)
        .eq("status", "approved")
        .maybeSingle());
      if (!parentComment) return res.status(400).json({ message: "Reply target is invalid" });
    }
    const isAuthor = req.user?.id === post.author_id;
    const comment = unwrap(await getSupabase()
      .from("comments")
      .insert({
        text: text.trim(),
        author_id: req.user?.id || null,
        guest_name: req.user ? "" : guestName.trim(),
        post_id: post.id,
        parent_id: parent || null,
        status: req.user && (req.user.role === "admin" || isAuthor) ? "approved" : "pending",
      })
      .select("*")
      .single());
    res.status(201).json(mapComment(comment));
  } catch (error) {
    next(error);
  }
});

router.delete("/:postId/comments/:commentId", protect, async (req, res, next) => {
  try {
    if (!isUuid(req.params.postId) || !isUuid(req.params.commentId)) return res.status(404).json({ message: "Comment not found" });
    const comment = unwrap(await getSupabase()
      .from("comments")
      .select("*, post:posts!comments_post_id_fkey(id, author_id)")
      .eq("id", req.params.commentId)
      .maybeSingle());
    if (!comment || comment.post_id !== req.params.postId) return res.status(404).json({ message: "Comment not found" });
    if (comment.author_id !== req.user.id && req.user.role !== "admin" && comment.post.author_id !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    unwrap(await getSupabase().from("comments").delete().eq("id", comment.id));
    res.json({ message: "Comment deleted" });
  } catch (error) {
    next(error);
  }
});

router.patch("/:postId/comments/:commentId", protect, authorize("admin"), async (req, res, next) => {
  try {
    if (!["approved", "flagged", "removed"].includes(req.body.status)) return res.status(400).json({ message: "Invalid comment status" });
    const comment = unwrap(await getSupabase()
      .from("comments")
      .update({ status: req.body.status, updated_at: new Date().toISOString() })
      .eq("id", req.params.commentId)
      .eq("post_id", req.params.postId)
      .select("*")
      .maybeSingle());
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    res.json(mapComment(comment));
  } catch (error) {
    next(error);
  }
});

export default router;
