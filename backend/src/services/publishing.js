import Post from "../models/Post.js";

export default async function publishScheduledPosts() {
  const result = await Post.updateMany(
    { status: "scheduled", scheduledAt: { $lte: new Date() } },
    { $set: { status: "published", scheduledAt: null } }
  );
  return result.modifiedCount;
}