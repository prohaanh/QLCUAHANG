import { createBrowserClient } from '@supabase/ssr'

// Dùng trong Client Component (form đăng nhập...) — đọc từ biến môi trường, không cần sửa
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
