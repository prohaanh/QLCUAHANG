import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { show?: string }
}) {
  const showAll = searchParams?.show === 'all'
  const supabase = createClient()

  let query = supabase
    .from('customers')
    .select('id, name, phone, is_active, created_at')
    .order('created_at', { ascending: false })

  if (!showAll) {
    query = query.eq('is_active', true)
  }

  const [{ data: customers }, { data: tiers }] = await Promise.all([
    query,
    supabase.from('customer_tier_view').select('customer_id, spend_12m, tier_name, discount_percent'),
  ])

  const tierByCustomer = new Map((tiers ?? []).map((t) => [t.customer_id, t]))

  return (
    <main className="min-h-screen">
      <header className="border-b-2 border-board bg-board text-panel px-6 py-5 flex items-baseline justify-between">
        <h1 className="font-mono text-lg tracking-tight">Khách hàng</h1>
        <a href="/" className="font-mono text-xs text-copper hover:underline">
          ← về trang chính
        </a>
      </header>

      <section className="px-6 py-10 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <a
            href={showAll ? '/customers' : '/customers?show=all'}
            className="font-mono text-xs text-copper hover:underline"
          >
            {showAll ? 'chỉ hiện đang theo dõi' : 'hiện cả khách ngừng theo dõi'}
          </a>
          <a
            href="/customers/new"
            className="bg-board text-panel font-mono text-xs px-3 py-1.5 hover:bg-boardline transition-colors"
          >
            + thêm khách hàng
          </a>
        </div>

        <div className="flex flex-col divide-y divide-board/15 border-t border-b border-board/15">
          {(customers ?? []).map((c) => {
            const tier = tierByCustomer.get(c.id)
            return (
              <a
                key={c.id}
                href={`/customers/${c.id}`}
                className="flex items-center justify-between py-3 hover:bg-board/5 -mx-2 px-2"
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-sm">{c.name}</span>
                  {!c.is_active && (
                    <span className="font-mono text-[10px] text-copper border border-copper px-1.5 py-0.5">
                      ngừng theo dõi
                    </span>
                  )}
                  {c.is_active && tier && tier.tier_name && (
                    <span className="font-mono text-[10px] text-board border border-board/40 px-1.5 py-0.5">
                      {tier.tier_name}
                    </span>
                  )}
                </div>
                <span className="font-mono text-xs text-ink/50">{c.phone ?? '—'}</span>
              </a>
            )
          })}
          {(customers ?? []).length === 0 && (
            <p className="font-mono text-xs text-ink/40 py-3">— chưa có khách hàng nào —</p>
          )}
        </div>
      </section>
    </main>
  )
}
