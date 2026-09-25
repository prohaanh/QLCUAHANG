'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth'

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    throw new Error('Chỉ admin mới có quyền này.')
  }
  return user
}

export async function createStaffUser(formData: FormData) {
  await requireAdmin()

  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')
  const full_name = String(formData.get('full_name') || '').trim()
  const role = String(formData.get('role') || 'nhan_vien')

  if (!email || !password || !full_name) {
    throw new Error('Thiếu thông tin — cần đủ họ tên, email, mật khẩu.')
  }

  const admin = createAdminClient()

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  })

  if (error) throw new Error(error.message)

  // Trigger on_auth_user_created đã tự tạo hàng public.users với role mặc định 'nhan_vien'.
  // Nếu chọn 'admin' thì cập nhật lại ngay.
  if (role === 'admin' && data.user) {
    await admin.from('users').update({ role: 'admin' }).eq('id', data.user.id)
  }

  revalidatePath('/admin/users')
}

export async function updateUserRole(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get('id') || '')
  const role = String(formData.get('role') || '')

  if (!id || (role !== 'admin' && role !== 'nhan_vien')) {
    throw new Error('Dữ liệu không hợp lệ.')
  }

  const supabase = createClient()
  const { error } = await supabase.from('users').update({ role }).eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/users')
}
