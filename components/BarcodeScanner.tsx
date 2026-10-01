'use client';

import { useEffect, useRef, useState } from 'react';
import { ui } from '@/lib/scan-styles';

const REGION_ID = 'barcode-scanner-region';

type Props = {
  /** Gọi khi quét được 1 mã (camera hoặc gõ/máy quét cầm tay + Enter) */
  onScan: (text: string) => void;
  /** barcode = mã vạch 1D, qr = QR, all = cả hai */
  mode?: 'barcode' | 'qr' | 'all';
  label?: string;
};

export default function BarcodeScanner({
  onScan,
  mode = 'all',
  label = 'Quét bằng camera',
}: Props) {
  const [active, setActive] = useState(false);
  const [error, setError] = useState('');
  const [manual, setManual] = useState('');
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const last = useRef({ text: '', at: 0 });

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let started = false;
    let scanner: any = null;

    (async () => {
      try {
        // import động: thư viện chỉ chạy trên trình duyệt, tránh lỗi khi build/SSR
        const { Html5Qrcode, Html5QrcodeSupportedFormats: F } = await import('html5-qrcode');
        if (cancelled) return;

        const qr = [F.QR_CODE];
        const bar = [F.EAN_13, F.EAN_8, F.UPC_A, F.UPC_E, F.CODE_128, F.CODE_39, F.ITF];
        const formats = mode === 'qr' ? qr : mode === 'barcode' ? bar : [...qr, ...bar];

        scanner = new Html5Qrcode(REGION_ID, {
          formatsToSupport: formats,
          useBarCodeDetectorIfSupported: true,
          verbose: false,
        } as any);

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10 },
          (text: string) => {
            const now = Date.now();
            if (text === last.current.text && now - last.current.at < 1500) return;
            last.current = { text, at: now };
            navigator.vibrate?.(60);
            onScanRef.current(text);
            setActive(false); // tắt camera sau khi quét được
          },
          () => {} // bỏ qua lỗi từng khung hình không đọc được
        );
        started = true;

        if (cancelled) {
          await scanner.stop().catch(() => {});
          scanner.clear();
        }
      } catch (e: any) {
        if (cancelled) return;
        const msg = typeof e === 'string' ? e : e?.message || '';
        setError(
          /permission|denied|NotAllowed/i.test(msg)
            ? 'Chưa được cấp quyền camera. Hãy cho phép camera cho trang này trong cài đặt trình duyệt.'
            : `Không mở được camera${msg ? `: ${msg}` : ''}. Camera chỉ chạy trên HTTPS.`
        );
        setActive(false);
      }
    })();

    return () => {
      cancelled = true;
      if (scanner && started) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
      }
    };
  }, [active, mode]);

  return (
    <div style={ui.card}>
      {active ? (
        <>
          <div id={REGION_ID} style={{ width: '100%', minHeight: 240 }} />
          <div style={ui.muted}>Đưa mã vào khung hình, giữ máy ổn định và đủ sáng.</div>
          <button type="button" style={ui.btnGhost} onClick={() => setActive(false)}>
            Tắt camera
          </button>
        </>
      ) : (
        <button
          type="button"
          style={ui.btn}
          onClick={() => {
            setError('');
            setActive(true);
          }}
        >
          📷 {label}
        </button>
      )}

      {error && <div style={ui.error}>{error}</div>}

      <input
        style={ui.input}
        placeholder="Hoặc dùng máy quét cầm tay / gõ mã rồi Enter"
        value={manual}
        onChange={(e) => setManual(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          const v = manual.trim();
          if (v) {
            onScanRef.current(v);
            setManual('');
          }
        }}
      />
    </div>
  );
}
