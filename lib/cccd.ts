export type CccdInfo = {
  cccd: string; // số CCCD 12 số
  cmnd_cu: string; // số CMND cũ (có thể rỗng)
  full_name: string;
  dob: string; // YYYY-MM-DD, rỗng nếu không đọc được
  gender: 'Nam' | 'Nữ' | '';
  address: string;
  issue_date: string; // YYYY-MM-DD
};

const toIso = (s?: string) =>
  s && /^\d{8}$/.test(s) ? `${s.slice(4)}-${s.slice(2, 4)}-${s.slice(0, 2)}` : '';

/**
 * QR trên CCCD gắn chip gồm các trường ngăn cách bởi "|":
 * số CCCD | số CMND cũ | họ tên | ngày sinh (ddmmyyyy) | giới tính | địa chỉ | ngày cấp (ddmmyyyy)
 * Trả về null nếu chuỗi không đúng định dạng này.
 */
export function parseCccdQr(raw: string): CccdInfo | null {
  const parts = raw.split('|').map((s) => s.trim());
  if (parts.length < 6) return null;
  const [cccd, cmnd, name, dob, gender, address, issue] = parts;
  if (!/^\d{12}$/.test(cccd) || !name) return null;

  const g = (gender || '').normalize('NFC');
  return {
    cccd,
    cmnd_cu: cmnd || '',
    full_name: name,
    dob: toIso(dob),
    gender: /^nam$/i.test(g) ? 'Nam' : /^n[ưữu]$/i.test(g) ? 'Nữ' : '',
    address: address || '',
    issue_date: toIso(issue),
  };
}
