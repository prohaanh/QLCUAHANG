// Parse chuỗi QR trên CCCD gắn chip Việt Nam.
// Định dạng chuẩn: soCCCD|soCMNDcu|hoTen|ngaySinh(ddMMyyyy)|gioiTinh|diaChi|ngayCap(ddMMyyyy)
export type ParsedCCCD = {
  cccd: string
  cmnd_cu: string
  name: string
  dob: string | null // yyyy-MM-dd
  gender: string
  address: string
}

function toIsoDate(ddMMyyyy: string): string | null {
  if (!/^\d{8}$/.test(ddMMyyyy)) return null
  const d = ddMMyyyy.slice(0, 2)
  const m = ddMMyyyy.slice(2, 4)
  const y = ddMMyyyy.slice(4, 8)
  return `${y}-${m}-${d}`
}

export function parseCCCD(raw: string): ParsedCCCD | null {
  const parts = raw.split('|')
  if (parts.length < 5) return null
  const [cccd, cmnd_cu, name, dobRaw, gender, address = ''] = parts
  if (!/^\d{9,12}$/.test(cccd)) return null
  return {
    cccd,
    cmnd_cu: cmnd_cu || '',
    name: name?.trim() || '',
    dob: toIsoDate(dobRaw || ''),
    gender: gender?.trim() || '',
    address: address?.trim() || '',
  }
}

// Nhận diện số điện thoại VN trong 1 chuỗi bất kỳ (dùng khi quét QR Zalo/khác)
export function extractPhone(raw: string): string | null {
  const match = raw.match(/(?:\+?84|0)(\d{9})/)
  if (!match) return null
  return '0' + match[1]
}

export function isZaloQr(raw: string): boolean {
  return /zalo\.me/i.test(raw)
}
