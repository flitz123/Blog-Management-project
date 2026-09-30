import "dotenv/config";
import connectDB from "./src/config/db.js";
import User from "./src/models/User.js";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
if (!email || !password || password.length < 8) {
	throw new Error("Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 8 characters in backend/.env before seeding.");
}

await connectDB();
let admin = await User.findOne({ email });
if (!admin) admin = new User({ name: "Administrator", email, password, role: "admin" });
else { admin.name = "Administrator"; admin.password = password; admin.role = "admin"; }
await admin.save();
console.log(`Admin account ready for ${email}.`);
process.exit(0);

