import express from "express";
import { getSupabase, unwrap } from "../config/db.js";
import { mapCategory, mapComment, mapPost, mapSubscription, mapUser } from "../utils/serializers.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect, authorize("admin"));

const countRows = async (table) => {
  const { count, error } = await getSupabase().from(table).select("id", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
};

router.get("/overview", async (_req, res, next) => {
  try {
    const [users, posts, comments, views, popularRows] = await Promise.all([
      countRows("users"),
      countRows("posts"),
      countRows("comments"),
      unwrap(await getSupabase().rpc("total_post_views")),
      unwrap(await getSupabase().from("posts").select("id, title, views").eq("status", "published").order("views", { ascending: false }).limit(5)),
    ]);
    const postLikes = popularRows.length
      ? unwrap(await getSupabase().from("post_likes").select("post_id, user_id").in("post_id", popularRows.map((post) => post.id)))
      : [];
    const popularPosts = popularRows.map((post) => mapPost(post, {
      likes: postLikes.filter((like) => like.post_id === post.id),
    }));
    res.json({
      users,
      posts,
      comments,
      views,
      popularPosts,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/users", async (_req, res, next) => {
  try {
    const users = unwrap(await getSupabase().from("users").select("*").order("created_at", { ascending: false }));
    res.json(users.map(mapUser));
  } catch (error) {
    next(error);
  }
});

router.patch("/users/:id", async (req, res, next) => {
  try {
    if (!["reader", "author", "admin"].includes(req.body.role)) return res.status(400).json({ message: "Invalid user role" });
    if (req.params.id === req.user.id && req.body.role !== "admin") return res.status(400).json({ message: "You cannot remove your own admin role" });
    const user = unwrap(await getSupabase()
      .from("users")
      .update({ role: req.body.role, updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select("id, name, email, role, bio, avatar, subscribed, created_at, updated_at")
      .maybeSingle());
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(mapUser(user));
  } catch (error) {
    next(error);
  }
});

router.delete("/users/:id", async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ message: "You cannot delete your own account here" });
    const user = unwrap(await getSupabase().from("users").delete().eq("id", req.params.id).select("id").maybeSingle());
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (error) {
    next(error);
  }
});

router.get("/comments", async (_req, res, next) => {
  try {
    const comments = unwrap(await getSupabase()
      .from("comments")
      .select("*, author:users!comments_author_id_fkey(id, name), post:posts!comments_post_id_fkey(id, title)")
      .in("status", ["pending", "flagged"])
      .order("created_at", { ascending: false }));
    res.json(comments.map(mapComment));
  } catch (error) {
    next(error);
  }
});

router.patch("/comments/:id", async (req, res, next) => {
  try {
    if (!["approved", "flagged", "removed"].includes(req.body.status)) return res.status(400).json({ message: "Invalid comment status" });
    const comment = unwrap(await getSupabase()
      .from("comments")
      .update({ status: req.body.status, updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select("*")
      .maybeSingle());
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    res.json(mapComment(comment));
  } catch (error) {
    next(error);
  }
});

router.get("/categories", async (_req, res, next) => {
  try {
    const categories = unwrap(await getSupabase()
      .from("categories")
      .select("*, parent:categories!categories_parent_id_fkey(id, name)")
      .order("name"));
    res.json(categories.map(mapCategory));
  } catch (error) {
    next(error);
  }
});

router.post("/categories", async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ message: "Category name is required" });
    const category = unwrap(await getSupabase()
      .from("categories")
      .insert({ name, description: req.body.description || "" })
      .select("*")
      .single());
    res.status(201).json(mapCategory(category));
  } catch (error) {
    next(error);
  }
});

router.delete("/categories/:id", async (req, res, next) => {
  try {
    unwrap(await getSupabase().from("categories").delete().eq("id", req.params.id));
    res.json({ message: "Category deleted" });
  } catch (error) {
    next(error);
  }
});

router.get("/subscriptions", async (_req, res, next) => {
  try {
    const subscriptions = unwrap(await getSupabase().from("subscriptions").select("*").order("created_at", { ascending: false }));
    res.json(subscriptions.map(mapSubscription));
  } catch (error) {
    next(error);
  }
});

export default router;
