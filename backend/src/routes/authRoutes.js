import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

router.post("/register", async (req, res) => {
  const { name, username, email, password } = req.body;
  try {
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if ((!name && !username) || !/^\S+@\S+\.\S+$/.test(normalizedEmail) || typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ message: "Name, valid email, and a password of at least 8 characters are required" });
    }
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(409).json({ message: "An account with this email already exists" });

    const user = await User.create({ name: name || username, email: normalizedEmail, password });
    res.status(201).json({ message: "User registered successfully", user: { id: user._id, name: user.name, email: user.email, role: user.role }, token: generateToken(user._id) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: typeof email === "string" ? email.trim().toLowerCase() : "" });
    if (user && (await user.matchPassword(password))) {
      res.json({
        user: { id: user._id, name: user.name, email: user.email, role: user.role, bio: user.bio, avatar: user.avatar },
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/me", protect, (req, res) => res.json({ user: req.user }));

router.patch("/me", protect, async (req, res, next) => {
  try {
    const updates = {};
    for (const field of ["name", "bio", "avatar"]) if (field in req.body) updates[field] = req.body[field];
    if ("name" in updates && !updates.name?.trim()) return res.status(400).json({ message: "Display name is required" });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select("-password");
    res.json({ user });
  } catch (error) { next(error); }
});

router.patch("/password", protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: "Current password and a new password of at least 8 characters are required" });
    }
    const user = await User.findById(req.user._id);
    if (!(await user.matchPassword(currentPassword))) return res.status(400).json({ message: "Current password is incorrect" });
    user.password = newPassword;
    await user.save();
    res.json({ message: "Password updated" });
  } catch (error) { next(error); }
});

export default router;

