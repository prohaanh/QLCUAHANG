'use client'

import { useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setLoading(false)
      setError('Sai email hoặc mật khẩu.')
      return
    }

    router.push(searchParams.get('next') || '/')
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-panel px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm border-2 border-board">
        <div className="border-b-2 border-board bg-board text-panel px-6 py-4">
          <h1 className="font-mono text-lg tracking-tight">QLCuaHang</h1>
          <p className="font-mono text-xs text-copper mt-1">đăng nhập</p>
        </div>

        <div className="px-6 py-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-ink/70">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-board/30 bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:border-board"
              autoFocus
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-ink/70">Mật khẩu</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-board/30 bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:border-board"
            />
          </label>

          {error && <p className="text-sm text-copper border-l-2 border-copper pl-3">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-board text-panel py-2 text-sm font-mono tracking-tight hover:bg-boardline transition-colors disabled:opacity-50"
          >
            {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>
        </div>
      </form>
    </main>
  )
}
