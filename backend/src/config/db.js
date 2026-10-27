import { createClient } from "@supabase/supabase-js";

let supabase;

export const getSupabase = () => {
  if (supabase) return supabase;

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in backend/.env.");
  }

  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return supabase;
};

export const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

const connectDB = async () => {
  try {
    unwrap(await getSupabase().from("users").select("id").limit(1));
    console.log("Supabase connected");
  } catch (error) {
    console.error("Supabase connection failed:", error.message);
    throw error;
  }
};

export default connectDB;
