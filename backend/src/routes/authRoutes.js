import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getSupabase, unwrap } from "../config/db.js";
import { mapUser } from "../utils/serializers.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

router.post("/register", async (req, res, next) => {
  const { name, username, email, password } = req.body;
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if ((!name && !username) || !/^\S+@\S+\.\S+$/.test(normalizedEmail) || typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ message: "Name, valid email, and a password of at least 8 characters are required" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = unwrap(await getSupabase()
      .from("users")
      .insert({ name: name || username, email: normalizedEmail, password_hash: passwordHash })
      .select("id, name, email, role, bio, avatar, created_at, updated_at")
      .single());
    const publicUser = mapUser(user);
    res.status(201).json({
      message: "User registered successfully",
      user: { id: user.id, _id: user.id, name: user.name, email: user.email, role: user.role },
      token: generateToken(publicUser.id),
    });
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ message: "An account with this email already exists" });
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const { password } = req.body;
  try {
    const user = unwrap(await getSupabase()
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle());
    if (!user || typeof password !== "string" || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const publicUser = mapUser(user);
    res.json({ user: publicUser, token: generateToken(user.id) });
  } catch (error) {
    next(error);
  }
});

router.get("/me", protect, (req, res) => res.json({ user: req.user }));

router.patch("/me", protect, async (req, res, next) => {
  try {
    const updates = {};
    for (const field of ["name", "bio", "avatar"]) if (field in req.body) updates[field] = req.body[field];
    if ("name" in updates) {
      if (typeof updates.name !== "string" || !updates.name.trim()) return res.status(400).json({ message: "Display name is required" });
      updates.name = updates.name.trim();
    }
    if ("bio" in updates) updates.bio = String(updates.bio ?? "");
    if ("avatar" in updates) updates.avatar = String(updates.avatar ?? "");
    updates.updated_at = new Date().toISOString();
    const user = unwrap(await getSupabase()
      .from("users")
      .update(updates)
      .eq("id", req.user.id)
      .select("id, name, email, role, bio, avatar, subscribed, created_at, updated_at")
      .single());
    res.json({ user: mapUser(user) });
  } catch (error) {
    next(error);
  }
});

router.patch("/password", protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (typeof currentPassword !== "string" || typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({ message: "Current password and a new password of at least 8 characters are required" });
    }
    const user = unwrap(await getSupabase()
      .from("users")
      .select("password_hash")
      .eq("id", req.user.id)
      .single());
    if (!(await bcrypt.compare(currentPassword, user.password_hash))) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    unwrap(await getSupabase()
      .from("users")
      .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
      .eq("id", req.user.id));
    res.json({ message: "Password updated" });
  } catch (error) {
    next(error);
  }
});

export default router;
