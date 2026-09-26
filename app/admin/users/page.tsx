import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { createStaffUser, updateUserRole, updateUserJobFunctions, setUserActive } from './actions'

export const dynamic = 'force-dynamic'

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

  const [{ data: users }, { data: jobFunctions }, { data: assignments }] = await Promise.all([
    supabase.from('users').select('id, full_name, role, is_active, created_at').order('created_at', { ascending: true }),
    supabase.from('job_functions').select('id, name, sort_order').order('sort_order', { ascending: true }),
    supabase.from('user_job_functions').select('user_id, job_function_id'),
  ])

  const jobFunctionsByUser = new Map<string, Set<string>>()
  for (const a of assignments ?? []) {
    if (!jobFunctionsByUser.has(a.user_id)) jobFunctionsByUser.set(a.user_id, new Set())
    jobFunctionsByUser.get(a.user_id)!.add(a.job_function_id)
  }

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
          {(users ?? []).map((u) => {
            const activeJobIds = jobFunctionsByUser.get(u.id) ?? new Set<string>()
            return (
              <div key={u.id} className="flex flex-col gap-3 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm">{u.full_name}</span>
                    {!u.is_active && (
                      <span className="font-mono text-[10px] text-copper border border-copper px-1.5 py-0.5">
                        đã khoá
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
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

                    {u.id !== me.id && (
                      <form action={setUserActive}>
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="next_active" value={(!u.is_active).toString()} />
                        <button type="submit" className="font-mono text-xs text-copper hover:underline">
                          {u.is_active ? 'khoá' : 'mở khoá'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                <form action={updateUserJobFunctions} className="flex items-center flex-wrap gap-x-4 gap-y-1 pl-1">
                  <input type="hidden" name="id" value={u.id} />
                  {(jobFunctions ?? []).map((jf) => (
                    <label key={jf.id} className="flex items-center gap-1.5 text-xs text-ink/70">
                      <input
                        type="checkbox"
                        name="job_functions"
                        value={jf.id}
                        defaultChecked={activeJobIds.has(jf.id)}
                      />
                      {jf.name}
                    </label>
                  ))}
                  <button type="submit" className="font-mono text-xs text-copper hover:underline">
                    lưu chức năng
                  </button>
                </form>
              </div>
            )
          })}
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

          <div className="flex flex-col gap-1.5 border border-board/20 px-3 py-3">
            <span className="text-xs text-ink/60 mb-1">Chức năng công việc</span>
            {(jobFunctions ?? []).map((jf) => (
              <label key={jf.id} className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" name="job_functions" value={jf.id} />
                {jf.name}
              </label>
            ))}
          </div>

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
