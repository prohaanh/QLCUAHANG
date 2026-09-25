'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ToggleActiveButton({
  customerId,
  isActive,
}: {
  customerId: string
  isActive: boolean
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  async function toggle() {
    if (isActive) {
      // đang active, hỏi xác nhận trước khi ngừng theo dõi
      const ok = window.confirm(
        'Ngừng theo dõi khách hàng này? Đơn hàng/license cũ vẫn được giữ nguyên, chỉ ẩn khách khỏi danh sách chính.'
      )
      if (!ok) return
    }
    setSaving(true)
    await supabase.from('customers').update({ is_active: !isActive }).eq('id', customerId)
    setSaving(false)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className={`text-xs font-mono underline ${isActive ? 'text-red-600' : 'text-copper'}`}
    >
      {saving ? 'Đang lưu…' : isActive ? 'Ngừng theo dõi khách hàng' : 'Khôi phục theo dõi'}
    </button>
  )
}
