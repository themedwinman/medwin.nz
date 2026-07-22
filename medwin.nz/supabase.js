// Shared Supabase client for the public site and the admin page.
//
// The publishable key below is SAFE to expose in client-side code — that is
// exactly what it is designed for. The real access control is Row Level
// Security in the database:
//   • anyone may READ projects where visible = true
//   • only an authenticated admin session may create / edit / delete
// See schema.sql for the policies.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const SUPABASE_URL = "https://ruvwewscxjmnrqsggoys.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_MOsn7LpGN6C4dEeitGhymg_Oum7kyBC";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
