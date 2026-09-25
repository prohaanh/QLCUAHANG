'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  onResult: (raw: string) => void
  onClose: () => void
}

// Dùng html5-qrcode để quét QR CCCD (chip) hoặc QR Zalo bằng camera điện thoại/PC.
// Đã thêm "html5-qrcode" vào package.json.
export default function QRScanner({ onResult, onClose }: Props) {
  const containerId = useRef('qr-scanner-' + Math.random().toString(36).slice(2))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let scanner: any
    let stopped = false

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (stopped) return
      scanner = new Html5Qrcode(containerId.current)
      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 260, height: 260 } },
          (decodedText: string) => {
            onResult(decodedText)
            scanner.stop().catch(() => {})
          },
          () => {
            /* lỗi từng frame, bỏ qua */
          }
        )
        .catch((err: any) => setError('Không mở được camera: ' + err))
    })

    return () => {
      stopped = true
      if (scanner) {
        scanner.stop().catch(() => {})
      }
    }
  }, [onResult])

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
      <div className="bg-panel rounded-lg p-4 w-full max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-mono">Quét QR CCCD / Zalo</span>
          <button onClick={onClose} className="text-ink/60 text-sm">
            Đóng ✕
          </button>
        </div>
        <div id={containerId.current} className="w-full" />
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        <p className="text-xs text-ink/50 mt-3">
          Đưa mã QR mặt sau CCCD hoặc mã QR Zalo vào khung hình.
        </p>
      </div>
    </div>
  )
}
