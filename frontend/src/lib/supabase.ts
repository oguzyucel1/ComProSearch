import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // Warn during dev builds; avoid crashing the app
  // eslint-disable-next-line no-console
  console.warn(
    "VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing. Supabase client will not work until set."
  );
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");
