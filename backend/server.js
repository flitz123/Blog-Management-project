import "dotenv/config";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";

const port = process.env.PORT || 5000;

await connectDB();

if (!process.env.VERCEL) {
  app.listen(port, () => console.log(`Blog API listening on port ${port}`));
}

export default app;