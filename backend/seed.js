import "dotenv/config";
import connectDB from "./src/config/db.js";
import User from "./src/models/User.js";

await connectDB();
const email = process.env.ADMIN_EMAIL || "admin@example.com";
const password = process.env.ADMIN_PASSWORD || "change-this-password";
let admin = await User.findOne({ email });
if (!admin) admin = new User({ name: "Administrator", email, password, role: "admin" });
else { admin.name = "Administrator"; admin.password = password; admin.role = "admin"; }
await admin.save();
console.log(`Admin account ready for ${email}. Set ADMIN_PASSWORD in .env before production use.`);
process.exit(0);

