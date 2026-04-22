// External Supabase client — points at the client-owned Supabase project.
//
// NOTE: Intentionally untyped. The auto-generated `Database` type in
// src/integrations/supabase/types.ts reflects the (now-orphaned) Lovable
// Cloud schema, NOT the client's real Supabase project. Using it here would
// produce false type errors on every query. RLS still protects the data;
// we just lose compile-time row typing and rely on hand-written interfaces
// in each hook/component.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dhbyembenuuscgqwbpwq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoYnllbWJlbnV1c2NncXdicHdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MjcyMDgsImV4cCI6MjA5MjAwMzIwOH0.mSMwZGiTfi__Pf53xD09Fa9Vsv-1G6FG81IZUP5kx4k";

export const SUPABASE_PROJECT_URL = SUPABASE_URL;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
