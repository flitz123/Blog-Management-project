import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    excerpt: { type: String, default: "" },
    tags: [{ type: String, trim: true }],
    coverImage: { type: String, default: "" },
    category: { type: String, default: "Uncategorized", trim: true },
    subcategory: { type: String, default: "", trim: true },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    views: { type: Number, default: 0 },
    revisions: [{
      title: String, content: String, savedAt: { type: Date, default: Date.now },
    }],
  },
  { timestamps: true }
);

postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ title: "text", content: "text", tags: "text", category: "text" });

export default mongoose.model("Post", postSchema);
