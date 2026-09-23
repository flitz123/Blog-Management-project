import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null },
    status: { type: String, enum: ["pending", "approved", "flagged", "removed"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.model("Comment", commentSchema);
