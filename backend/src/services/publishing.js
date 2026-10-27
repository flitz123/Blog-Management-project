import { getSupabase, unwrap } from "../config/db.js";

export default async function publishScheduledPosts() {
  const posts = unwrap(await getSupabase()
    .from("posts")
    .update({ status: "published", scheduled_at: null, updated_at: new Date().toISOString() })
    .eq("status", "scheduled")
    .lte("scheduled_at", new Date().toISOString())
    .select("id"));
  return posts.length;
}
