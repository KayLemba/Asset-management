import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://blcjkgdjibhknsvhqwmw.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsY2prZ2RqaWJoa25zdmhxd213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NDU4MjcsImV4cCI6MjEwMzIyMTgyN30.20abcA-RPawUlnHA7fdM8s5fG6mLfu9NNaUVA8TkKOE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);