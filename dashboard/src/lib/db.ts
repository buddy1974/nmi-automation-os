// NMI Automation OS — DB Client
// Phase 12 — Foundation placeholder
// Replace with Supabase client in Phase 12.2b

export const db = {
  connected: false
}

// ── Phase 12.2b — uncomment and configure after Supabase project is created ──
//
// import { createClient } from "@supabase/supabase-js"
//
// const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
// const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
//
// export const supabase = createClient(supabaseUrl, supabaseKey)
//
// export const db = {
//   connected: true,
//   client: supabase
// }
