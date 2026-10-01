import type { CSSProperties } from 'react';

// Style inline dùng chung cho các trang quét mã (Nhánh 4A).
// Dùng inline để chạy được dù dự án có cấu hình Tailwind hay không.
export const ui: Record<string, CSSProperties> = {
  page: { maxWidth: 520, margin: '0 auto', padding: 16, display: 'grid', gap: 12 },
  card: {
    border: '1px solid #d4d4d8',
    borderRadius: 10,
    padding: 12,
    display: 'grid',
    gap: 8,
  },
  row: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  label: { fontSize: 13, color: '#71717a' },
  input: {
    padding: '10px 12px',
    border: '1px solid #a1a1aa',
    borderRadius: 8,
    fontSize: 16, // >=16px để iOS không tự phóng to khi focus
    width: '100%',
    boxSizing: 'border-box',
  },
  btn: {
    padding: '10px 14px',
    borderRadius: 8,
    border: 'none',
    background: '#2563eb',
    color: '#fff',
    fontSize: 16,
    cursor: 'pointer',
  },
  btnGhost: {
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #a1a1aa',
    background: 'transparent',
    color: 'inherit',
    fontSize: 16,
    cursor: 'pointer',
  },
  error: { color: '#dc2626', fontSize: 14 },
  ok: { color: '#16a34a', fontSize: 14 },
  muted: { color: '#71717a', fontSize: 14 },
};
