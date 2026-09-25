import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { createStaffUser, updateUserRole } from './actions'

export default async function AdminUsersPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/login')

  if (me.role !== 'admin') {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <p className="text-sm text-copper border-l-2 border-copper pl-3">
          Chỉ admin mới xem được trang này.
        </p>
      </main>
    )
  }

  const supabase = createClient()
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, role, created_at')
    .order('created_at', { ascending: true })

  return (
    <main className="min-h-screen">
      <header className="border-b-2 border-board bg-board text-panel px-6 py-5 flex items-baseline justify-between">
        <h1 className="font-mono text-lg tracking-tight">Quản lý người dùng</h1>
        <a href="/" className="font-mono text-xs text-copper hover:underline">
          ← về trang chính
        </a>
      </header>

      <section className="px-6 py-10 max-w-2xl">
        <h2 className="text-sm text-ink/70 mb-3">Danh sách nhân viên</h2>
        <div className="flex flex-col divide-y divide-board/15 border-t border-b border-board/15 mb-10">
          {(users ?? []).map((u) => (
            <div key={u.id} className="flex items-center justify-between py-3 gap-4">
              <span className="text-sm">{u.full_name}</span>
              <form action={updateUserRole} className="flex items-center gap-2">
                <input type="hidden" name="id" value={u.id} />
                <select
                  name="role"
                  defaultValue={u.role}
                  className="border border-board/30 bg-white px-2 py-1 text-xs font-mono"
                >
                  <option value="nhan_vien">nhân viên</option>
                  <option value="admin">admin</option>
                </select>
                <button type="submit" className="font-mono text-xs text-copper hover:underline">
                  lưu
                </button>
              </form>
            </div>
          ))}
          {(users ?? []).length === 0 && (
            <p className="font-mono text-xs text-ink/40 py-3">— chưa có ai —</p>
          )}
        </div>

        <h2 className="text-sm text-ink/70 mb-3">Thêm nhân viên mới</h2>
        <form action={createStaffUser} className="flex flex-col gap-3 max-w-sm">
          <input
            name="full_name"
            placeholder="Họ tên"
            required
            className="border border-board/30 bg-white px-3 py-2 text-sm"
          />
          <input
            name="email"
            type="email"
            placeholder="Email đăng nhập"
            required
            className="border border-board/30 bg-white px-3 py-2 text-sm font-mono"
          />
          <input
            name="password"
            type="password"
            placeholder="Mật khẩu tạm (≥ 6 ký tự)"
            required
            minLength={6}
            className="border border-board/30 bg-white px-3 py-2 text-sm font-mono"
          />
          <select
            name="role"
            defaultValue="nhan_vien"
            className="border border-board/30 bg-white px-3 py-2 text-sm font-mono"
          >
            <option value="nhan_vien">nhân viên</option>
            <option value="admin">admin</option>
          </select>
          <button
            type="submit"
            className="mt-2 bg-board text-panel py-2 text-sm font-mono tracking-tight hover:bg-boardline transition-colors"
          >
            Tạo tài khoản
          </button>
        </form>
      </section>
    </main>
  )
}
