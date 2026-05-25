import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://fmsmncroddzmmrrohaeh.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtc21uY3JvZGR6bW1ycm9oYWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NzUwMTgsImV4cCI6MjA5NTI1MTAxOH0.U71I4uZVALeYK2foUdcVtvXG2TtA-9LzFsm5Poig5VI";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);