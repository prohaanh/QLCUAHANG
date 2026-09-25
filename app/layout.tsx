import type { Metadata } from 'next'
import './globals.css'
import { getCurrentUser } from '@/lib/auth'
import LogoutButton from '@/components/LogoutButton'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'QLCuaHang',
  description: 'Quản lý cửa hàng sửa chữa phần cứng',
  manifest: '/manifest.json',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  return (
    <html lang="vi">
      <body className="font-sans">
        {user && (
          <div className="bg-board text-panel/90 text-xs font-mono px-6 py-1.5 flex items-center justify-between">
            <span>
              {user.full_name} · {user.role === 'admin' ? 'Quản trị' : 'Nhân viên'}
            </span>
            <LogoutButton />
          </div>
        )}
        {children}
      </body>
    </html>
  )
}
