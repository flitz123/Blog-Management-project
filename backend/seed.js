import "dotenv/config";
import bcrypt from "bcryptjs";
import { getSupabase, unwrap } from "./src/config/db.js";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
if (!email || !password || password.length < 8) {
  throw new Error("Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 8 characters in backend/.env before seeding.");
}

const passwordHash = await bcrypt.hash(password, 10);
const admin = unwrap(await getSupabase()
  .from("users")
  .upsert({
    name: "Administrator",
    email,
    password_hash: passwordHash,
    role: "admin",
    updated_at: new Date().toISOString(),
  }, { onConflict: "email" })
  .select("id, email")
  .single());

console.log(`Admin account ready for ${admin.email}.`);
