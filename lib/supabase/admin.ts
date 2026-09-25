import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// CHỈ import file này trong Server Action / Route Handler.
// Dùng service_role key — có toàn quyền, tuyệt đối không đưa vào Client Component.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
