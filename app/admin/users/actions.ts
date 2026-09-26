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
  const jobFunctionIds = formData.getAll('job_functions').map(String)

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

  if (jobFunctionIds.length > 0 && data.user) {
    await admin
      .from('user_job_functions')
      .insert(jobFunctionIds.map((job_function_id) => ({ user_id: data.user!.id, job_function_id })))
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

export async function updateUserJobFunctions(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get('id') || '')
  if (!id) throw new Error('Thiếu người dùng.')
  const jobFunctionIds = formData.getAll('job_functions').map(String)

  const admin = createAdminClient()

  const { error: delErr } = await admin.from('user_job_functions').delete().eq('user_id', id)
  if (delErr) throw new Error(delErr.message)

  if (jobFunctionIds.length > 0) {
    const { error: insErr } = await admin
      .from('user_job_functions')
      .insert(jobFunctionIds.map((job_function_id) => ({ user_id: id, job_function_id })))
    if (insErr) throw new Error(insErr.message)
  }

  revalidatePath('/admin/users')
}

export async function setUserActive(formData: FormData) {
  const me = await requireAdmin()

  const id = String(formData.get('id') || '')
  const nextActive = String(formData.get('next_active')) === 'true'

  if (!id) throw new Error('Thiếu người dùng.')
  if (id === me.id) throw new Error('Không thể tự khoá chính mình.')

  const admin = createAdminClient()

  // Khoá thật ở tầng đăng nhập, không chỉ ẩn UI
  const { error: authErr } = await admin.auth.admin.updateUserById(id, {
    ban_duration: nextActive ? 'none' : '876000h', // ~100 năm ~ vô thời hạn
  })
  if (authErr) throw new Error(authErr.message)

  const { error } = await admin.from('users').update({ is_active: nextActive }).eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/users')
}
