'use client'

import { useState } from 'react'
import { upsertCategory, deleteCategory } from './actions'

export default function CategoryManager({ categories }: { categories: any[] }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)

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
                  deleteCategory(c.id)
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
          action={async (fd) => { await upsertCategory(fd); setOpen(false); setEditing(null) }}
          className="border p-3 mt-2 space-y-2 max-w-sm"
        >
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <input name="name" defaultValue={editing?.name} placeholder="Tên nhóm (VD: Linh kiện)" required className="border p-1 w-full" />
          <input name="sort_order" type="number" defaultValue={editing?.sort_order ?? 0} placeholder="Thứ tự hiển thị" className="border p-1 w-full" />
          <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">Lưu</button>
        </form>
      )}
    </section>
  )
}
