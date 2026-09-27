import { createClient } from '@/lib/supabase/server'
import ProductForm from './ProductForm'
import CategoryManager from './CategoryManager'

export default async function ProductsPage() {
  const supabase = await createClient()

  const [{ data: categories }, { data: products }, { data: services }] = await Promise.all([
    supabase.from('product_categories').select('*').order('sort_order'),
    supabase.from('products').select('*, product_categories(name)').order('name'),
    supabase.from('services').select('*, product_categories(name)').order('name'),
  ])

  return (
    <div className="p-4 space-y-8">
      <h1 className="text-xl font-bold">Quản lý sản phẩm & dịch vụ</h1>

      <CategoryManager categories={categories ?? []} />

      <section>
        <h2 className="font-semibold mb-2">Hàng hóa (linh kiện, phụ kiện)</h2>
        <ProductForm categories={categories ?? []} />
        <table className="w-full text-sm mt-3 border-collapse">
          <thead>
            <tr className="border-b text-left">
              <th className="p-2">Tên</th>
              <th className="p-2">Nhóm</th>
              <th className="p-2">Giá</th>
              <th className="p-2">Tồn kho</th>
              <th className="p-2">Bảo hành (tháng)</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {products?.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="p-2">{p.name}</td>
                <td className="p-2">{p.product_categories?.name ?? '—'}</td>
                <td className="p-2">{p.price.toLocaleString('vi-VN')}đ</td>
                <td className={`p-2 ${p.stock_qty <= 0 ? 'text-red-600 font-semibold' : ''}`}>
                  {p.stock_qty}
                </td>
                <td className="p-2">{p.warranty_months}</td>
                <td className="p-2">
                  <ProductForm categories={categories ?? []} product={p} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Dịch vụ sửa chữa</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b text-left">
              <th className="p-2">Tên</th>
              <th className="p-2">Nhóm</th>
              <th className="p-2">Giá mặc định</th>
            </tr>
          </thead>
          <tbody>
            {services?.map((s) => (
              <tr key={s.id} className="border-b">
                <td className="p-2">{s.name}</td>
                <td className="p-2">{s.product_categories?.name ?? '—'}</td>
                <td className="p-2">{s.default_price.toLocaleString('vi-VN')}đ</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
