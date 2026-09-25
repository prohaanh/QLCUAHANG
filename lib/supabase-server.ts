import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Dùng trong Server Components / Route Handlers. Đọc phiên đăng nhập từ cookie
// request hiện tại, để biết ai đang đăng nhập (phục vụ hiển thị + phân quyền sau).
export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        // Next.js mặc định cache lại các lệnh fetch() phía server (kể cả khi route
        // đã "dynamic" do dùng cookies()) — tắt hẳn để dữ liệu luôn lấy mới nhất
        // từ Supabase, tránh hiện thông tin cũ sau khi DB đã đổi (vd role admin).
        fetch: (url, options) => fetch(url, { ...(options ?? {}), cache: 'no-store' }),
      },
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, options)
          } catch {
            // gọi từ Server Component (không phải Route Handler/action) sẽ lỗi ở đây,
            // bỏ qua vì middleware đã lo việc refresh cookie.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set(name, '', options)
          } catch {
            // như trên
          }
        },
      },
    }
  )
}
