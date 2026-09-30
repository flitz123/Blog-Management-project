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
    status: { type: String, enum: ["draft", "scheduled", "published", "archived"], default: "draft" },
    scheduledAt: { type: Date, default: null },
    slug: { type: String, trim: true, maxlength: 120, unique: true, sparse: true },
    metaTitle: { type: String, trim: true, default: "", maxlength: 70 },
    metaDescription: { type: String, trim: true, default: "", maxlength: 160 },
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
postSchema.pre("validate", function () {
  if (!this.slug) {
    const base = (this.title || "post").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "post";
    this.slug = `${base}-${this._id.toString().slice(-6)}`;
  } else {
    this.slug = this.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!this.slug) this.slug = `${this._id.toString()}`;
  }
});

export default mongoose.model("Post", postSchema);
