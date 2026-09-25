import { createClient } from '@/lib/supabase-server'
import CustomerForm from '@/components/CustomerForm'
import ToggleActiveButton from '@/components/ToggleActiveButton'

const STATUS_LABEL: Record<string, string> = {
  mo: 'Đang mở',
  da_thanh_toan: 'Đã thanh toán',
  huy: 'Đã huỷ',
}

const LICENSE_STATUS_LABEL: Record<string, string> = {
  con_han: 'Còn hạn',
  sap_het_han: 'Sắp hết hạn',
  het_han: 'Hết hạn',
}

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', params.id)
    .single()

  const { data: tier } = await supabase
    .from('customer_tier_view')
    .select('tier_name, spend_12m, discount_percent')
    .eq('customer_id', params.id)
    .maybeSingle()

  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, total, created_at')
    .eq('customer_id', params.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: licenses } = await supabase
    .from('license_status')
    .select('id, product_name, expire_date, status')
    .eq('customer_id', params.id)
    .order('expire_date', { ascending: false })
    .limit(20)

  return (
    <main className="min-h-screen">
      <header className="border-b-2 border-board bg-board text-panel px-6 py-5">
        <h1 className="font-mono text-lg tracking-tight">
          {customer ? customer.name : 'Khách hàng'}
        </h1>
      </header>
      <section className="px-6 py-8">
        {tier && (
          <div className="mb-6 border border-copper/40 rounded px-4 py-3 max-w-md flex items-center justify-between">
            <div>
              <p className="text-xs text-ink/50">Hạng khách hàng</p>
              <p className="font-mono text-sm text-copper">{tier.tier_name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink/50">Chi tiêu 12 tháng gần nhất</p>
              <p className="font-mono text-sm">
                {Number(tier.spend_12m).toLocaleString('vi-VN')} đ
                {tier.discount_percent > 0 && ` · ưu đãi ${tier.discount_percent}%`}
              </p>
            </div>
          </div>
        )}
        {customer ? (
          <CustomerForm
            initial={{
              id: customer.id,
              name: customer.name ?? '',
              phone: customer.phone ?? '',
              cccd: customer.cccd ?? '',
              dob: customer.dob ?? '',
              gender: customer.gender ?? '',
              address: customer.address ?? '',
              zalo_id: customer.zalo_id ?? '',
              note: customer.note ?? '',
            }}
          />
        ) : (
          <p className="text-sm text-red-600">Không tìm thấy khách hàng.</p>
        )}

        {customer && (
          <div className="mt-3 max-w-md">
            <ToggleActiveButton customerId={customer.id} isActive={customer.is_active} />
          </div>
        )}

        {customer && (
          <div className="mt-10 max-w-md">
            <h2 className="font-mono text-sm mb-3">Lịch sử đơn hàng</h2>
            {!orders?.length && (
              <p className="font-mono text-xs text-ink/40">— chưa có đơn hàng nào —</p>
            )}
            <ul className="flex flex-col divide-y divide-board/15 border-t border-b border-board/15">
              {orders?.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-mono text-xs text-ink/50">
                    {new Date(o.created_at).toLocaleDateString('vi-VN')} · {STATUS_LABEL[o.status] ?? o.status}
                  </span>
                  <span className="font-mono">{Number(o.total).toLocaleString('vi-VN')} đ</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {customer && (
          <div className="mt-8 max-w-md">
            <h2 className="font-mono text-sm mb-3">Phần mềm / bản quyền đã cấp</h2>
            {!licenses?.length && (
              <p className="font-mono text-xs text-ink/40">— chưa có license nào —</p>
            )}
            <ul className="flex flex-col divide-y divide-board/15 border-t border-b border-board/15">
              {licenses?.map((l) => (
                <li key={l.id} className="flex items-center justify-between py-2 text-sm">
                  <span>{l.product_name}</span>
                  <span className="font-mono text-xs text-ink/50">
                    {LICENSE_STATUS_LABEL[l.status] ?? l.status} · hết hạn{' '}
                    {new Date(l.expire_date).toLocaleDateString('vi-VN')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </main>
  )
}
