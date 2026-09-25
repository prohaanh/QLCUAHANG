import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase-server'
import UserForm from '@/components/UserForm'

export default async function NewUserPage() {
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect('/login')
  if (currentUser.role !== 'admin') redirect('/')

  const supabase = createClient()
  const { data: jobFunctions } = await supabase
    .from('job_functions')
    .select('id, name')
    .order('sort_order')

  return (
    <main className="min-h-screen">
      <header className="border-b-2 border-board bg-board text-panel px-6 py-5">
        <h1 className="font-mono text-lg tracking-tight">Thêm người dùng</h1>
      </header>
      <section className="px-6 py-8">
        <UserForm jobFunctions={jobFunctions ?? []} />
      </section>
    </main>
  )
}
