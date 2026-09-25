import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { show?: string }
}) {
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect('/login')
  if (currentUser.role !== 'admin') redirect('/')

  const showInactive = searchParams.show === 'all'
  const supabase = createClient()

  let query = supabase
    .from('users')
    .select('id, full_name, email, role, is_active')
    .order('full_name')

  if (!showInactive) query = query.eq('is_active', true)

  const { data: users } = await query

  const ids = users?.map((u) => u.id) ?? []
  const { data: assigned } = ids.length
    ? await supabase
        .from('user_job_functions')
        .select('user_id, job_functions(name)')
        .in('user_id', ids)
    : { data: [] }

  const functionsByUser = new Map<string, string[]>()
  for (const row of assigned ?? []) {
    const name = (row as any).job_functions?.name
    if (!name) continue
    const list = functionsByUser.get(row.user_id) ?? []
    list.push(name)
    functionsByUser.set(row.user_id, list)
  }

  return (
    <main className="min-h-screen">
      <header className="border-b-2 border-board bg-board text-panel px-6 py-5 flex items-baseline justify-between">
        <h1 className="font-mono text-lg tracking-tight">Người dùng</h1>
        <Link href="/users/new" className="text-xs text-copper font-mono">
          + Thêm người dùng
        </Link>
      </header>

      <section className="px-6 py-8 max-w-2xl">
        <div className="mb-6">
          <Link
            href={showInactive ? '/users' : '/users?show=all'}
            className="text-xs text-ink/50 underline"
          >
            {showInactive ? 'Chỉ hiện người đang hoạt động' : 'Hiện cả người đã ngừng theo dõi'}
          </Link>
        </div>

        {!users?.length && <p className="font-mono text-xs text-ink/40">— chưa có người dùng nào —</p>}

        <ul className="flex flex-col divide-y divide-board/15 border-t border-b border-board/15">
          {users?.map((u) => (
            <li key={u.id}>
              <Link
                href={`/users/${u.id}`}
                className={`flex items-center justify-between py-3 hover:bg-board/5 ${
                  u.is_active ? '' : 'opacity-40'
                }`}
              >
                <div>
                  <p className="text-sm flex items-center gap-2 flex-wrap">
                    {u.full_name}
                    <span className="font-mono text-[10px] border border-board/40 rounded px-1.5 py-0.5">
                      {u.role === 'admin' ? 'Quản trị' : 'Nhân viên'}
                    </span>
                    {!u.is_active && (
                      <span className="font-mono text-[10px] border border-ink/30 text-ink/50 rounded px-1.5 py-0.5">
                        đã ngừng
                      </span>
                    )}
                  </p>
                  <p className="font-mono text-xs text-ink/50">
                    {u.email}
                    {(functionsByUser.get(u.id) ?? []).length > 0 &&
                      ` · ${functionsByUser.get(u.id)!.join(', ')}`}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
