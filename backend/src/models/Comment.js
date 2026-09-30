import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, maxlength: 5000 },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    guestName: { type: String, trim: true, maxlength: 80, default: "" },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null },
    status: { type: String, enum: ["pending", "approved", "flagged", "removed"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.model("Comment", commentSchema);
