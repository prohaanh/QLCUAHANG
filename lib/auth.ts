import { createClient } from '@/lib/supabase/server'

export type UserRole = 'admin' | 'nhan_vien'

export type UserProfile = {
  id: string
  email: string | null
  full_name: string
  role: UserRole
}

// Dùng trong Server Component / Server Action để biết ai đang đăng nhập và vai trò gì
export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  let { data: profile } = await supabase
    .from('users')
    .select('id, full_name, role')
    .eq('id', user.id)
    .maybeSingle()

  // Older project databases link the profile through auth_user_id instead of users.id.
  if (!profile) {
    const { data: linkedProfile } = await supabase
      .from('users')
      .select('id, full_name, role')
      .eq('auth_user_id', user.id)
      .maybeSingle()
    profile = linkedProfile
  }

  return {
    id: user.id,
    email: user.email ?? null,
    full_name: profile?.full_name ?? user.email ?? 'Người dùng',
    role: (profile?.role as UserRole) ?? 'nhan_vien',
  }
}
