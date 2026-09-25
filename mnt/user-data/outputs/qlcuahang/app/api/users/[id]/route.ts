import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase-admin'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser()
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Chỉ quản trị mới được sửa người dùng.' }, { status: 403 })
  }

  const body = await request.json()
  const { full_name, role, function_ids, is_active } = body as {
    full_name?: string
    role?: 'admin' | 'nhan_vien'
    function_ids?: string[]
    is_active?: boolean
  }

  const admin = createAdminClient()
  const targetId = params.id

  const updatePayload: Record<string, any> = {}
  if (full_name !== undefined) updatePayload.full_name = full_name.trim()
  if (role !== undefined) updatePayload.role = role
  if (is_active !== undefined) updatePayload.is_active = is_active

  if (Object.keys(updatePayload).length) {
    const { error } = await admin.from('users').update(updatePayload).eq('id', targetId)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Ngừng theo dõi = vừa ẩn khỏi danh sách vừa chặn đăng nhập thật sự (ban ở Supabase Auth).
  // Khôi phục = gỡ ban.
  if (is_active !== undefined) {
    await admin.auth.admin.updateUserById(targetId, {
      ban_duration: is_active ? 'none' : '876000h', // ~100 năm ~ vô thời hạn
    })
  }

  if (function_ids !== undefined) {
    await admin.from('user_job_functions').delete().eq('user_id', targetId)
    if (function_ids.length) {
      const rows = function_ids.map((fid) => ({ user_id: targetId, function_id: fid }))
      await admin.from('user_job_functions').insert(rows)
    }
  }

  return NextResponse.json({ ok: true })
}
