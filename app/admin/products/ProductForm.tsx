'use client'

import { useState } from 'react'
import { upsertProduct, adjustStock } from './actions'

export default function ProductForm({ categories, product }: { categories: any[]; product?: any }) {
  const [open, setOpen] = useState(false)
  const [stockQty, setStockQty] = useState('')

  return (
    <div>
      <button className="text-blue-600 underline" onClick={() => setOpen(!open)}>
        {product ? 'Sửa' : '+ Thêm hàng hóa'}
      </button>
      {open && (
        <div className="border p-3 mt-2 space-y-2">
          <form action={async (fd) => { await upsertProduct(fd); setOpen(false) }} className="space-y-2">
            {product && <input type="hidden" name="id" value={product.id} />}
            <input name="name" defaultValue={product?.name} placeholder="Tên sản phẩm" required className="border p-1 w-full" />
            <select name="category_id" defaultValue={product?.category_id ?? ''} className="border p-1 w-full">
              <option value="">-- Nhóm --</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input name="price" type="number" defaultValue={product?.price} placeholder="Giá bán" required className="border p-1 w-full" />
            <input name="warranty_months" type="number" defaultValue={product?.warranty_months} placeholder="Bảo hành (tháng)" className="border p-1 w-full" />
            <input name="barcode" defaultValue={product?.barcode} placeholder="Mã vạch (nếu có)" className="border p-1 w-full" />
            <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">Lưu</button>
          </form>

          {product && (
            <div className="border-t pt-2 flex gap-2 items-center">
              <input value={stockQty} onChange={(e) => setStockQty(e.target.value)}
                type="number" placeholder="Số lượng nhập" className="border p-1 w-32" />
              <button
                className="bg-green-600 text-white px-2 py-1 rounded"
                onClick={async () => { await adjustStock(product.id, Number(stockQty), 'nhap', 'Nhập kho thủ công'); setStockQty('') }}
              >
                Nhập kho
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
