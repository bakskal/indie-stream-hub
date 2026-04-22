// External Supabase client — points at the client-owned Supabase project.
// This REPLACES src/integrations/supabase/client.ts for all app code.
// The Lovable Cloud auto-managed client is now orphaned.
//
// URL + anon key are safe to ship in the browser bundle (RLS protects data).
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const SUPABASE_URL = "https://dhbyembenuuscgqwbpwq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoYnllbWJlbnV1c2NncXdicHdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MjcyMDgsImV4cCI6MjA5MjAwMzIwOH0.mSMwZGiTfi__Pf53xD09Fa9Vsv-1G6FG81IZUP5kx4k";

export const SUPABASE_PROJECT_URL = SUPABASE_URL;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
