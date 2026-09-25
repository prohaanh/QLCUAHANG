'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ToggleUserActiveButton({
  userId,
  isActive,
}: {
  userId: string
  isActive: boolean
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  async function toggle() {
    if (isActive) {
      const ok = window.confirm(
        'Ngừng theo dõi người dùng này? Tài khoản sẽ bị khoá đăng nhập ngay, dữ liệu cũ vẫn giữ nguyên.'
      )
      if (!ok) return
    }
    setSaving(true)
    await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !isActive }),
    })
    setSaving(false)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className={`text-xs font-mono underline ${isActive ? 'text-red-600' : 'text-copper'}`}
    >
      {saving ? 'Đang lưu…' : isActive ? 'Ngừng theo dõi (khoá đăng nhập)' : 'Khôi phục theo dõi'}
    </button>
  )
}
