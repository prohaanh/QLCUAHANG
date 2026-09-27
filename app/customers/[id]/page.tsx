import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ToggleActiveButton from '@/components/ToggleActiveButton'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = {
  con_han: 'còn hạn',
  sap_het_han: 'sắp hết hạn',
  het_han: 'đã hết hạn',
}

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const [{ data: customer }, { data: tier }, { data: orders }, { data: licenses }] = await Promise.all([
    supabase.from('customers').select('*').eq('id', params.id).single(),
    supabase.from('customer_tier_view').select('*').eq('customer_id', params.id).single(),
    supabase
      .from('orders')
      .select('id, status, total, created_at')
      .eq('customer_id', params.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('license_status')
      .select('id, product_name, expire_date, status')
      .eq('customer_id', params.id)
      .order('expire_date', { ascending: true }),
  ])

  if (!customer) notFound()

  return (
    <main className="min-h-screen">
      <header className="border-b-2 border-board bg-board text-panel px-6 py-5 flex items-baseline justify-between">
        <h1 className="font-mono text-lg tracking-tight">{customer.name}</h1>
        <a href="/customers" className="font-mono text-xs text-copper hover:underline">
          ← danh sách khách hàng
        </a>
      </header>

      <section className="px-6 py-10 max-w-2xl flex flex-col gap-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            {!customer.is_active && (
              <span className="font-mono text-[10px] text-copper border border-copper px-1.5 py-0.5">
                ngừng theo dõi
              </span>
            )}
            {customer.is_active && tier?.tier_name && (
              <span className="font-mono text-[10px] text-board border border-board/40 px-1.5 py-0.5">
                hạng {tier.tier_name} · ưu đãi {tier.discount_percent}%
              </span>
            )}
            <ToggleActiveButton customerId={customer.id} isActive={customer.is_active} />
          </div>

          <div className="flex flex-col divide-y divide-board/15 border-t border-b border-board/15">
            <Field label="Điện thoại" value={customer.phone} />
            <Field label="CCCD" value={customer.cccd} />
            <Field label="Ngày sinh" value={customer.dob} />
            <Field label="Giới tính" value={customer.gender} />
            <Field label="Địa chỉ" value={customer.address} />
            <Field label="Zalo" value={customer.zalo_id} />
            <Field label="Ghi chú" value={customer.note} />
            <Field
              label="Chi tiêu 12 tháng"
              value={tier ? Number(tier.spend_12m).toLocaleString('vi-VN') + ' đ' : null}
            />
          </div>
        </div>

        <div>
          <h2 className="text-sm text-ink/70 mb-3">Lịch sử đơn hàng</h2>
          {(orders ?? []).length === 0 ? (
            <p className="font-mono text-xs text-ink/40">— chưa có đơn hàng nào —</p>
          ) : (
            <div className="flex flex-col divide-y divide-board/15 border-t border-b border-board/15">
              {orders!.map((o) => (
                <div key={o.id} className="flex items-center justify-between py-2.5">
                  <span className="font-mono text-xs text-ink/60">
                    {new Date(o.created_at).toLocaleDateString('vi-VN')} · {o.status}
                  </span>
                  <span className="font-mono text-sm text-board">
                    {Number(o.total).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-sm text-ink/70 mb-3">Phần mềm / bản quyền đã cấp</h2>
          {(licenses ?? []).length === 0 ? (
            <p className="font-mono text-xs text-ink/40">— chưa có mục nào —</p>
          ) : (
            <div className="flex flex-col divide-y divide-board/15 border-t border-b border-board/15">
              {licenses!.map((l) => (
                <div key={l.id} className="flex items-center justify-between py-2.5">
                  <span className="text-sm">{l.product_name}</span>
                  <span
                    className={`font-mono text-xs ${l.status === 'het_han' ? 'text-copper' : l.status === 'sap_het_han' ? 'text-copper' : 'text-ink/50'}`}
                  >
                    {l.expire_date} · {STATUS_LABEL[l.status] ?? l.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex items-baseline justify-between py-2.5">
      <span className="text-sm text-ink/60">{label}</span>
      <span className="text-sm">{value || '—'}</span>
    </div>
  )
}
