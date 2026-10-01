'use client'

import { useState } from 'react'
import { upsertCategory, deleteCategory } from './actions'

export default function CategoryManager({ categories }: { categories: any[] }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function saveCategory(formData: FormData) {
    setBusy(true)
    setError('')
    try {
      await upsertCategory(formData)
      setOpen(false)
      setEditing(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không lưu được nhóm.')
    } finally {
      setBusy(false)
    }
  }

  async function removeCategory(id: string) {
    setError('')
    try {
      await deleteCategory(id)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không xóa được nhóm.')
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Nhóm sản phẩm / dịch vụ</h2>
        <button className="text-blue-600 underline" onClick={() => { setEditing(null); setOpen(!open) }}>
          + Thêm nhóm
        </button>
      </div>

      <ul className="mt-2 space-y-1 text-sm">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center gap-2">
            <span>{c.name}</span>
            <button className="text-blue-600 underline text-xs" onClick={() => { setEditing(c); setOpen(true) }}>
              Sửa
            </button>
            <button
              className="text-red-600 underline text-xs"
              onClick={() => {
                if (confirm(`Xóa nhóm "${c.name}"? Sản phẩm/dịch vụ đang gán nhóm này sẽ về "chưa phân loại".`)) {
                  void removeCategory(c.id)
                }
              }}
            >
              Xóa
            </button>
          </li>
        ))}
      </ul>

      {open && (
        <form
          action={saveCategory}
          className="border p-3 mt-2 space-y-2 max-w-sm"
        >
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <input name="name" defaultValue={editing?.name} placeholder="Tên nhóm (VD: Linh kiện)" required className="border p-1 w-full" />
          <input name="sort_order" type="number" defaultValue={editing?.sort_order ?? 0} placeholder="Thứ tự hiển thị" className="border p-1 w-full" />
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={busy} className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50">
            {busy ? 'Đang lưu…' : 'Lưu nhóm'}
          </button>
        </form>
      )}
      {error && !open && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  )
}
