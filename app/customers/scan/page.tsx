'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BarcodeScanner from '@/components/BarcodeScanner';
import { createClient } from '@/lib/supabase/browser'; // đối chiếu tên export thật trong file này
import { parseCccdQr } from '@/lib/cccd';
import { ui } from '@/lib/scan-styles';

// Tên 2 cột này CHƯA được kiểm chứng với DB thật — đối chiếu bằng câu SQL trong GHI_CHU_CAC_BUOC.md,
// nếu khác thì chỉ cần sửa 2 dòng dưới.
const COL_NAME = 'name';
const COL_PHONE = 'phone';

export default function ScanCustomerPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [step, setStep] = useState<'idle' | 'form' | 'exists'>('idle');
  const [existing, setExisting] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const [cccd, setCccd] = useState('');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  function reset() {
    setStep('idle');
    setExisting(null);
    setErr('');
    setCccd('');
    setName('');
    setDob('');
    setGender('');
    setAddress('');
    setPhone('');
  }

  async function handleScan(raw: string) {
    setErr('');
    const info = parseCccdQr(raw.trim());
    if (!info) {
      setErr('Không đọc được. Hãy quét mã QR trên thẻ CCCD gắn chip (mặt trước, góc trên bên phải).');
      return;
    }
    setBusy(true);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('cccd', info.cccd)
      .maybeSingle();
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    if (data) {
      setExisting(data);
      setStep('exists');
      return;
    }
    setCccd(info.cccd);
    setName(info.full_name);
    setDob(info.dob);
    setGender(info.gender);
    setAddress(info.address);
    setStep('form');
  }

  async function save() {
    if (!name.trim()) {
      setErr('Nhập họ tên.');
      return;
    }
    setErr('');
    setBusy(true);
    const { data, error } = await supabase
      .from('customers')
      .insert({
        [COL_NAME]: name.trim(),
        [COL_PHONE]: phone.trim() || null,
        cccd,
        dob: dob || null,
        gender: gender || null,
        address: address.trim() || null,
      })
      .select('id')
      .single();
    setBusy(false);
    if (error || !data) {
      setErr(error?.message || 'Không thêm được khách.');
      return;
    }
    router.push(`/customers/${data.id}`);
  }

  return (
    <div style={ui.page}>
      <h1 style={{ fontSize: 20, margin: 0 }}>Thêm khách bằng QR CCCD</h1>
      <Link href="/customers" style={ui.muted}>
        ← Về danh sách khách hàng
      </Link>

      {step === 'idle' && <BarcodeScanner mode="qr" label="Quét QR trên CCCD" onScan={handleScan} />}
      {busy && <div style={ui.muted}>Đang xử lý…</div>}
      {err && <div style={ui.error}>{err}</div>}

      {step === 'exists' && existing && (
        <div style={ui.card}>
          <strong>Khách này đã có trong hệ thống</strong>
          <div>{existing[COL_NAME]}</div>
          {existing.is_active === false && (
            <div style={ui.muted}>Đang ở trạng thái ngừng theo dõi — vào trang chi tiết để khôi phục.</div>
          )}
          <Link href={`/customers/${existing.id}`} style={{ ...ui.btn, textDecoration: 'none', textAlign: 'center' }}>
            Mở hồ sơ khách
          </Link>
        </div>
      )}

      {step === 'form' && (
        <div style={ui.card}>
          <div style={ui.muted}>Kiểm tra lại thông tin đọc từ CCCD, thêm số điện thoại rồi lưu.</div>
          <div style={ui.label}>Số CCCD</div>
          <input style={ui.input} value={cccd} readOnly />
          <div style={ui.label}>Họ tên *</div>
          <input style={ui.input} value={name} onChange={(e) => setName(e.target.value)} />
          <div style={ui.label}>Số điện thoại</div>
          <input
            style={ui.input}
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <div style={ui.label}>Ngày sinh</div>
          <input style={ui.input} type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          <div style={ui.label}>Giới tính</div>
          <select style={ui.input} value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">—</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>
          <div style={ui.label}>Địa chỉ</div>
          <input style={ui.input} value={address} onChange={(e) => setAddress(e.target.value)} />
          <button type="button" style={ui.btn} disabled={busy} onClick={save}>
            Lưu khách hàng
          </button>
        </div>
      )}

      {step !== 'idle' && (
        <button type="button" style={ui.btnGhost} onClick={reset}>
          Quét CCCD khác
        </button>
      )}
    </div>
  );
}
