import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postsRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import publishScheduledPosts from "./services/publishing.js";

const app = express();

app.use(helmet());
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173").split(",").map((origin) => origin.trim());
app.use(cors({
  origin: (origin, callback) => callback(null, !origin || Boolean(process.env.VERCEL) || allowedOrigins.includes(origin))
}));
app.use(express.json({ limit: "5mb" }));

app.get("/", (_req, res) => res.json({ status: "ok", service: "blog-api" }));
app.get("/api/health", async (_req, res) => {
  const supabaseConfigured = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  const jwtConfigured = Boolean(process.env.JWT_SECRET);
  let database = "not_configured";

  if (supabaseConfigured) {
    try {
      const { getSupabase } = await import("./config/db.js");
      const { error } = await getSupabase().from("users").select("id").limit(1);
      database = error ? `error:${error.message}` : "connected";
    } catch (error) {
      database = `error:${error.message}`;
    }
  }

  res.status(database === "connected" && jwtConfigured ? 200 : 503).json({
    status: database === "connected" && jwtConfigured ? "ok" : "configuration_error",
    supabaseConfigured,
    jwtConfigured,
    database,
  });
});
app.get("/api/cron/publish-scheduled", async (req, res, next) => {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers.authorization !== "Bearer " + secret) {
      return res.status(401).json({ message: "Not authorized" });
    }
    const published = await publishScheduledPosts();
    res.json({ published });
  } catch (error) { next(error); }
});
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api", publicRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  const status = error.status || (error.code === "23505" ? 409 : error.code === "23503" ? 400 : error.name === "ValidationError" ? 400 : 500);
  res.status(status).json({ message: status === 500 ? "Internal server error" : error.message });
});

export default app;
