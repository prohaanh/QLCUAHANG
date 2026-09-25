import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// CHỈ import file này trong app/api/**/route.ts (chạy trên server của Vercel).
// Không bao giờ import vào component có 'use client' — sẽ làm lộ service role key.
// SUPABASE_SERVICE_ROLE_KEY phải để trống NEXT_PUBLIC_ ở tên biến, khai báo trong
// Vercel > Settings > Environment Variables (không có trong .env commit lên git).
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
