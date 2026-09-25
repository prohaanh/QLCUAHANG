import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { q?: string; show?: string }
}) {
  const supabase = createClient()
  const q = searchParams.q?.trim() || ''
  const showInactive = searchParams.show === 'all'

  let query = supabase
    .from('customers')
    .select('id, name, phone, cccd, zalo_id, is_active, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (!showInactive) {
    query = query.eq('is_active', true)
  }

  if (q) {
    query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,cccd.ilike.%${q}%`)
  }

  const { data: customers, error } = await query

  const ids = customers?.map((c) => c.id) ?? []
  const { data: tiers } = ids.length
    ? await supabase.from('customer_tier_view').select('customer_id, tier_name').in('customer_id', ids)
    : { data: [] }
  const tierByCustomer = new Map((tiers ?? []).map((t) => [t.customer_id, t.tier_name]))

  return (
    <main className="min-h-screen">
      <header className="border-b-2 border-board bg-board text-panel px-6 py-5 flex items-baseline justify-between">
        <h1 className="font-mono text-lg tracking-tight">Khách hàng</h1>
        <Link href="/customers/new" className="text-xs text-copper font-mono">
          + Thêm khách hàng
        </Link>
      </header>

      <section className="px-6 py-8 max-w-2xl">
        <form className="mb-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Tìm theo tên, SĐT hoặc CCCD…"
            className="border border-board/30 rounded px-3 py-2 text-sm w-full max-w-sm"
          />
        </form>
        <div className="mb-6">
          <Link
            href={showInactive ? '/customers' : '/customers?show=all'}
            className="text-xs text-ink/50 underline"
          >
            {showInactive ? 'Chỉ hiện khách đang theo dõi' : 'Hiện cả khách đã ngừng theo dõi'}
          </Link>
        </div>

        {error && <p className="text-sm text-red-600">Lỗi tải danh sách: {error.message}</p>}

        {!error && (!customers || customers.length === 0) && (
          <p className="font-mono text-xs text-ink/40">— chưa có khách hàng nào —</p>
        )}

        <ul className="flex flex-col divide-y divide-board/15 border-t border-b border-board/15">
          {customers?.map((c) => (
            <li key={c.id}>
              <Link
                href={`/customers/${c.id}`}
                className={`flex items-center justify-between py-3 hover:bg-board/5 ${
                  c.is_active ? '' : 'opacity-40'
                }`}
              >
                <div>
                  <p className="text-sm flex items-center gap-2">
                    {c.name}
                    {tierByCustomer.get(c.id) && (
                      <span className="font-mono text-[10px] border border-copper text-copper rounded px-1.5 py-0.5">
                        {tierByCustomer.get(c.id)}
                      </span>
                    )}
                    {!c.is_active && (
                      <span className="font-mono text-[10px] border border-ink/30 text-ink/50 rounded px-1.5 py-0.5">
                        đã ngừng theo dõi
                      </span>
                    )}
                  </p>
                  <p className="font-mono text-xs text-ink/50">
                    {c.phone || '— chưa có SĐT —'}
                    {c.cccd ? ` · CCCD ${c.cccd}` : ''}
                    {c.zalo_id ? ' · Zalo' : ''}
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
