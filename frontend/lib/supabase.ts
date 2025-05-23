import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Local development fallback values (generated by `supabase start`)
const LOCAL_SUPABASE_URL = "http://localhost:54321"
// The default public anon key generated by the Supabase CLI dev server
const LOCAL_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1cGFiYXNlLWxvY2FsLWFub24ta2V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjB9.lnNu5Y2nhvP6i4zLFl4KxxWaHw1Na_aRPiZXkgnsHec"
const LOCAL_SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1cGFiYXNlLWxvY2FsLXNlcnZpY2Utcm9sZS1rZXkiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjowfQ.fM5IOQg0Zlq3HQ_-8e-5c9Hp0cz_DWRXBezSsfN7YiM"

// Create a single supabase client for the browser
export const createBrowserClient = () => {
  const supabaseUrl =
    (process.env.NEXT_PUBLIC_SUPABASE_URL as string) || LOCAL_SUPABASE_URL
  const supabaseAnonKey =
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string) || LOCAL_SUPABASE_ANON_KEY

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
}

// Create a single supabase client for server components
export const createServerClient = () => {
  const supabaseUrl = (process.env.SUPABASE_URL as string) || LOCAL_SUPABASE_URL
  const supabaseServiceKey =
    (process.env.SUPABASE_SERVICE_ROLE_KEY as string) ||
    LOCAL_SUPABASE_SERVICE_ROLE_KEY

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
