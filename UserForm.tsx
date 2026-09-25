'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type JobFunction = { id: string; name: string }

type Props = {
  jobFunctions: JobFunction[]
  initial?: {
    id: string
    full_name: string
    email: string
    role: 'admin' | 'nhan_vien'
    function_ids: string[]
  }
}

export default function UserForm({ jobFunctions, initial }: Props) {
  const router = useRouter()
  const isEdit = !!initial

  const [fullName, setFullName] = useState(initial?.full_name ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'nhan_vien'>(initial?.role ?? 'nhan_vien')
  const [functionIds, setFunctionIds] = useState<string[]>(initial?.function_ids ?? [])
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function toggleFunction(id: string) {
    setFunctionIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErrorMsg(null)

    const url = isEdit ? `/api/users/${initial!.id}` : '/api/users'
    const method = isEdit ? 'PATCH' : 'POST'
    const payload = isEdit
      ? { full_name: fullName, role, function_ids: functionIds }
      : { full_name: fullName, email, password, role, function_ids: functionIds }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setErrorMsg(data.error ?? 'Có lỗi xảy ra.')
      return
    }

    router.push('/users')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
      <label className="flex flex-col gap-1 text-sm">
        Họ tên *
        <input
          className="border border-board/30 rounded px-3 py-2"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Email {isEdit && <span className="text-ink/40">(không sửa được)</span>}
        <input
          type="email"
          className="border border-board/30 rounded px-3 py-2 disabled:bg-board/5"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isEdit}
          required={!isEdit}
        />
      </label>

      {!isEdit && (
        <label className="flex flex-col gap-1 text-sm">
          Mật khẩu ban đầu * (tối thiểu 6 ký tự)
          <input
            type="text"
            className="border border-board/30 rounded px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Vai trò
        <select
          className="border border-board/30 rounded px-3 py-2"
          value={role}
          onChange={(e) => setRole(e.target.value as 'admin' | 'nhan_vien')}
        >
          <option value="nhan_vien">Nhân viên</option>
          <option value="admin">Quản trị</option>
        </select>
      </label>

      <fieldset className="flex flex-col gap-2 text-sm">
        <legend className="mb-1">Chức năng đảm nhiệm (chọn được nhiều)</legend>
        {jobFunctions.map((f) => (
          <label key={f.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={functionIds.includes(f.id)}
              onChange={() => toggleFunction(f.id)}
            />
            {f.name}
          </label>
        ))}
      </fieldset>

      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

      <button
        type="submit"
        disabled={saving}
        className="bg-board text-panel rounded px-4 py-2 text-sm font-mono self-start"
      >
        {saving ? 'Đang lưu…' : 'Lưu'}
      </button>
    </form>
  )
}
