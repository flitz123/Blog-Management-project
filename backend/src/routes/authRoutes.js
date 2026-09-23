import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

router.post("/register", async (req, res) => {
  const { name, username, email, password } = req.body;
  try {
    if ((!name && !username) || !email || !password || password.length < 6) {
      return res.status(400).json({ message: "Name, email, and a password of at least 6 characters are required" });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "An account with this email already exists" });

    const user = await User.create({ name: name || username, email: email.toLowerCase(), password });
    res.status(201).json({ message: "User registered successfully", user: { id: user._id, name: user.name, email: user.email, role: user.role }, token: generateToken(user._id) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
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
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-password");
    res.json({ user });
  } catch (error) { next(error); }
});

export default router;

