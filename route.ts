import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  const currentUser = await getCurrentUser()
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Chỉ quản trị mới được thêm người dùng.' }, { status: 403 })
  }

  const body = await request.json()
  const { full_name, email, password, role, function_ids } = body as {
    full_name: string
    email: string
    password: string
    role: 'admin' | 'nhan_vien'
    function_ids: string[]
  }

  if (!full_name?.trim() || !email?.trim() || !password || password.length < 6) {
    return NextResponse.json(
      { error: 'Cần tên, email, mật khẩu (tối thiểu 6 ký tự).' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  // Tạo tài khoản đăng nhập — trigger handle_new_user() sẽ tự tạo sẵn 1 hàng
  // trong public.users với role mặc định 'nhan_vien', id = id của auth user này.
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
  })

  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message ?? 'Không tạo được tài khoản đăng nhập.' },
      { status: 400 }
    )
  }

  const userId = created.user.id

  // Cập nhật đúng tên/role/email (ghi đè giá trị mặc định trigger vừa tạo)
  const { error: updateError } = await admin
    .from('users')
    .update({ full_name: full_name.trim(), role: role ?? 'nhan_vien', email: email.trim(), auth_user_id: userId })
    .eq('id', userId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  if (function_ids?.length) {
    const rows = function_ids.map((fid) => ({ user_id: userId, function_id: fid }))
    await admin.from('user_job_functions').insert(rows)
  }

  return NextResponse.json({ id: userId })
}
