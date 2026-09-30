import "dotenv/config";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import publishScheduledPosts from "./src/services/publishing.js";

const port = process.env.PORT || 5000;
if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is required. Add it to backend/.env.");

await connectDB();

if (!process.env.VERCEL) {
  app.listen(port, () => console.log(`Blog API listening on port ${port}`));
  const publishingInterval = setInterval(() => {
    publishScheduledPosts().catch((error) => console.error("Scheduled publishing failed:", error));
  }, 60_000);
  publishingInterval.unref();
}

export default app;