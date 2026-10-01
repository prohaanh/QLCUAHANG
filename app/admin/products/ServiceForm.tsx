'use client'

import { useState } from 'react'
import { upsertService } from './actions'

type Category = { id: string; name: string }
type Service = {
  id: string
  name: string
  category_id: string | null
  default_price: number
}

export default function ServiceForm({
  categories,
  service,
}: {
  categories: Category[]
  service?: Service
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(formData: FormData) {
    setBusy(true)
    setError('')
    try {
      await upsertService(formData)
      setOpen(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không lưu được dịch vụ.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <button type="button" className="text-blue-600 underline" onClick={() => setOpen(!open)}>
        {service ? 'Sửa' : '+ Thêm dịch vụ'}
      </button>
      {open && (
        <form action={submit} className="border p-3 mt-2 space-y-2 max-w-sm">
          {service && <input type="hidden" name="id" value={service.id} />}
          <input
            name="name"
            defaultValue={service?.name}
            placeholder="Tên dịch vụ"
            required
            className="border p-1 w-full"
          />
          <select
            name="category_id"
            defaultValue={service?.category_id ?? ''}
            className="border p-1 w-full"
          >
            <option value="">-- Nhóm --</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input
            name="default_price"
            type="number"
            min="0"
            step="1"
            defaultValue={service?.default_price ?? 0}
            placeholder="Giá mặc định"
            required
            className="border p-1 w-full"
          />
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
          >
            {busy ? 'Đang lưu…' : 'Lưu dịch vụ'}
          </button>
        </form>
      )}
    </div>
  )
}
