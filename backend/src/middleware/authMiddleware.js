import jwt from "jsonwebtoken";
import { getSupabase, unwrap } from "../config/db.js";
import { mapUser } from "../utils/serializers.js";

const getToken = (req) => {
  const [scheme, token] = req.headers.authorization?.split(" ") ?? [];
  return scheme?.toLowerCase() === "bearer" ? token : null;
};

const loadUser = async (id) => {
  const row = unwrap(await getSupabase()
    .from("users")
    .select("id, name, email, role, bio, avatar, subscribed, created_at, updated_at")
    .eq("id", id)
    .maybeSingle());
  return mapUser(row);
};

export const protect = async (req, res, next) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ message: "Not authorized, no token" });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Token invalid" });
  }
  if (typeof decoded === "string" || !decoded.id) return res.status(401).json({ message: "Token invalid" });

  try {
    req.user = await loadUser(decoded.id);
    if (!req.user) return res.status(401).json({ message: "User no longer exists" });
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (req, res, next) => {
  const token = getToken(req);
  if (!token) return next();

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Token invalid" });
  }
  if (typeof decoded === "string" || !decoded.id) return res.status(401).json({ message: "Token invalid" });

  try {
    req.user = await loadUser(decoded.id);
    if (!req.user) return res.status(401).json({ message: "User no longer exists" });
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "You do not have permission to perform this action" });
  }
  next();
};
