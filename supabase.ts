'use client'

import { createBrowserClient } from '@supabase/ssr'

// Client dùng trong Client Components (form, nút bấm...). Phiên đăng nhập
// được lưu qua cookie (không phải localStorage) để đồng bộ với server/middleware.
// Không cần sửa file này — chỉ cần điền đúng .env.local (xem README.md)
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
