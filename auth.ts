import { createClient } from './supabase-server'

export type CurrentUser = {
  id: string
  full_name: string
  role: 'admin' | 'nhan_vien'
  email: string | null
}

// Trả về hàng trong bảng `users` khớp với người đang đăng nhập (Supabase Auth),
// hoặc null nếu chưa đăng nhập / chưa được gán vào bảng users.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) return null

  const { data: appUser } = await supabase
    .from('users')
    .select('id, full_name, role, email')
    .eq('auth_user_id', authUser.id)
    .maybeSingle()

  return appUser as CurrentUser | null
}
