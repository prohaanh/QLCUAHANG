import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function getCounts() {
  const supabase = createClient()
  try {
    const [{ count: openOrders }, { count: products }, { count: customers }, { data: expiring }] =
      await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'mo'),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('license_status').select('product_name, expire_date, status').eq('status', 'sap_het_han'),
      ])
    return {
      openOrders: openOrders ?? 0,
      products: products ?? 0,
      customers: customers ?? 0,
      expiring: expiring ?? [],
    }
  } catch {
    return { openOrders: 0, products: 0, customers: 0, expiring: [] }
  }
}

export default async function Home() {
  const { openOrders, products, customers, expiring } = await getCounts()

  const stats = [
    { label: 'Đơn đang mở', value: openOrders },
    { label: 'Sản phẩm trong kho', value: products },
    { label: 'Khách hàng', value: customers },
  ]

  return (
    <main className="min-h-screen">
      <header className="border-b-2 border-board bg-board text-panel px-6 py-5 flex items-baseline justify-between">
        <h1 className="font-mono text-lg tracking-tight">QLCuaHang</h1>
        <span className="font-mono text-xs text-copper">hạ tầng đã kết nối</span>
      </header>

      <section className="px-6 py-10 max-w-3xl">
        <p className="text-sm text-ink/60 mb-8 max-w-md">
          Bảng điều khiển kết nối trực tiếp tới cơ sở dữ liệu. Số liệu dưới đây là dữ liệu thật, không phải mẫu.
        </p>

        <div className="flex flex-col divide-y divide-board/15 border-t border-b border-board/15">
          {stats.map((s) => (
            <div key={s.label} className="flex items-baseline justify-between py-4">
              <span className="text-sm text-ink/70">{s.label}</span>
              <span className="font-mono text-2xl text-board">{s.value}</span>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <h2 className="text-sm text-ink/70 mb-3">Phần mềm sắp hết hạn (7 ngày tới)</h2>
          {expiring.length === 0 ? (
            <p className="font-mono text-xs text-ink/40">— không có mục nào —</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {expiring.map((l: any, i: number) => (
                <li key={i} className="flex items-baseline justify-between border-l-2 border-copper pl-3 py-1">
                  <span className="text-sm">{l.product_name}</span>
                  <span className="font-mono text-xs text-copper">{l.expire_date}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  )
}
