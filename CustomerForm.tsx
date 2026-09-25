'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { parseCCCD, extractPhone, isZaloQr } from '@/lib/parseCCCD'
import QRScanner from './QRScanner'

type CustomerData = {
  id?: string
  name: string
  phone: string
  cccd: string
  dob: string
  gender: string
  address: string
  zalo_id: string
  note: string
}

const empty: CustomerData = {
  name: '',
  phone: '',
  cccd: '',
  dob: '',
  gender: '',
  address: '',
  zalo_id: '',
  note: '',
}

export default function CustomerForm({ initial }: { initial?: Partial<CustomerData> }) {
  const router = useRouter()
  const [data, setData] = useState<CustomerData>({ ...empty, ...initial })
  const [showScanner, setShowScanner] = useState(false)
  const [scanHint, setScanHint] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function set<K extends keyof CustomerData>(key: K, value: CustomerData[K]) {
    setData((d) => ({ ...d, [key]: value }))
  }

  // Tìm khách đã có sẵn theo CCCD hoặc SĐT. Trả về id nếu trùng.
  async function findExisting(opts: { cccd?: string; phone?: string }): Promise<string | null> {
    const filters: string[] = []
    if (opts.cccd) filters.push(`cccd.eq.${opts.cccd}`)
    if (opts.phone) filters.push(`phone.eq.${opts.phone}`)
    if (filters.length === 0) return null

    const { data: found } = await supabase
      .from('customers')
      .select('id')
      .or(filters.join(','))
      .limit(1)
      .maybeSingle()

    return found?.id ?? null
  }

  async function handleScan(raw: string) {
    setShowScanner(false)

    const cccdInfo = parseCCCD(raw)
    if (cccdInfo) {
      if (!data.id) {
        const existingId = await findExisting({ cccd: cccdInfo.cccd })
        if (existingId) {
          router.push(`/customers/${existingId}`)
          return
        }
      }
      setData((d) => ({
        ...d,
        name: cccdInfo.name || d.name,
        cccd: cccdInfo.cccd,
        dob: cccdInfo.dob || d.dob,
        gender: cccdInfo.gender || d.gender,
        address: cccdInfo.address || d.address,
      }))
      setScanHint('Đã đọc thông tin từ CCCD.')
      return
    }

    if (isZaloQr(raw)) {
      const phone = extractPhone(raw)
      if (!data.id && phone) {
        const existingId = await findExisting({ phone })
        if (existingId) {
          router.push(`/customers/${existingId}`)
          return
        }
      }
      setData((d) => ({ ...d, zalo_id: raw }))
      if (phone) set('phone', phone)
      setScanHint('Đã lưu liên kết Zalo — hãy kiểm tra lại tên/SĐT.')
      return
    }

    const phone = extractPhone(raw)
    if (phone) {
      if (!data.id) {
        const existingId = await findExisting({ phone })
        if (existingId) {
          router.push(`/customers/${existingId}`)
          return
        }
      }
      set('phone', phone)
      setScanHint('Đã nhận diện số điện thoại từ mã quét.')
    } else {
      setScanHint('Không nhận diện được định dạng, đã lưu vào ghi chú.')
      set('note', data.note ? `${data.note}\n${raw}` : raw)
    }
  }

  // Khi người dùng gõ tay SĐT/CCCD (không qua quét) và rời khỏi ô, cũng kiểm tra trùng.
  async function checkDuplicateOnBlur(field: 'phone' | 'cccd', value: string) {
    if (data.id || !value.trim()) return
    const existingId = await findExisting({ [field]: value.trim() } as any)
    if (existingId) {
      router.push(`/customers/${existingId}`)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!data.name.trim()) {
      setErrorMsg('Cần nhập tên khách hàng.')
      return
    }
    setSaving(true)
    setErrorMsg(null)

    if (!data.id) {
      const existingId = await findExisting({
        cccd: data.cccd.trim() || undefined,
        phone: data.phone.trim() || undefined,
      })
      if (existingId) {
        setSaving(false)
        router.push(`/customers/${existingId}`)
        return
      }
    }

    const payload = {
      name: data.name.trim(),
      phone: data.phone.trim() || null,
      cccd: data.cccd.trim() || null,
      dob: data.dob || null,
      gender: data.gender || null,
      address: data.address.trim() || null,
      zalo_id: data.zalo_id.trim() || null,
      note: data.note.trim() || null,
      updated_at: new Date().toISOString(),
    }

    const query = data.id
      ? supabase.from('customers').update(payload).eq('id', data.id)
      : supabase.from('customers').insert(payload)

    const { error } = await query
    setSaving(false)

    if (error) {
      setErrorMsg(
        error.code === '23505'
          ? 'Số CCCD này đã tồn tại trong hệ thống.'
          : 'Lỗi khi lưu: ' + error.message
      )
      return
    }

    router.push('/customers')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
      <button
        type="button"
        onClick={() => {
          setScanHint(null)
          setShowScanner(true)
        }}
        className="border-2 border-board rounded px-4 py-3 text-sm font-mono self-start"
      >
        📷 Quét CCCD / Zalo để nhập nhanh
      </button>
      {scanHint && <p className="text-xs text-copper">{scanHint}</p>}

      <label className="flex flex-col gap-1 text-sm">
        Tên khách hàng *
        <input
          className="border border-board/30 rounded px-3 py-2"
          value={data.name}
          onChange={(e) => set('name', e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Số điện thoại
        <input
          className="border border-board/30 rounded px-3 py-2"
          value={data.phone}
          onChange={(e) => set('phone', e.target.value)}
          onBlur={(e) => checkDuplicateOnBlur('phone', e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Số CCCD
        <input
          className="border border-board/30 rounded px-3 py-2"
          value={data.cccd}
          onChange={(e) => set('cccd', e.target.value)}
          onBlur={(e) => checkDuplicateOnBlur('cccd', e.target.value)}
        />
      </label>

      <div className="flex gap-3">
        <label className="flex flex-col gap-1 text-sm flex-1">
          Ngày sinh
          <input
            type="date"
            className="border border-board/30 rounded px-3 py-2"
            value={data.dob}
            onChange={(e) => set('dob', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm w-28">
          Giới tính
          <input
            className="border border-board/30 rounded px-3 py-2"
            value={data.gender}
            onChange={(e) => set('gender', e.target.value)}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Địa chỉ
        <input
          className="border border-board/30 rounded px-3 py-2"
          value={data.address}
          onChange={(e) => set('address', e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Zalo
        <input
          className="border border-board/30 rounded px-3 py-2"
          value={data.zalo_id}
          onChange={(e) => set('zalo_id', e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Ghi chú
        <textarea
          className="border border-board/30 rounded px-3 py-2"
          value={data.note}
          onChange={(e) => set('note', e.target.value)}
        />
      </label>

      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

      <button
        type="submit"
        disabled={saving}
        className="bg-board text-panel rounded px-4 py-2 text-sm font-mono self-start"
      >
        {saving ? 'Đang lưu…' : 'Lưu khách hàng'}
      </button>

      {showScanner && <QRScanner onResult={handleScan} onClose={() => setShowScanner(false)} />}
    </form>
  )
}
