import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase-server'
import UserForm from '@/components/UserForm'
import ToggleUserActiveButton from '@/components/ToggleUserActiveButton'

export const dynamic = 'force-dynamic'

export default async function UserDetailPage({ params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect('/login')
  if (currentUser.role !== 'admin') redirect('/')

  const supabase = createClient()

  const { data: user } = await supabase
    .from('users')
    .select('id, full_name, email, role, is_active')
    .eq('id', params.id)
    .single()

  const { data: jobFunctions } = await supabase
    .from('job_functions')
    .select('id, name')
    .order('sort_order')

  const { data: assigned } = await supabase
    .from('user_job_functions')
    .select('function_id')
    .eq('user_id', params.id)

  return (
    <main className="min-h-screen">
      <header className="border-b-2 border-board bg-board text-panel px-6 py-5">
        <h1 className="font-mono text-lg tracking-tight">{user ? user.full_name : 'Người dùng'}</h1>
      </header>
      <section className="px-6 py-8">
        {user ? (
          <>
            <div className="mb-6">
              <ToggleUserActiveButton userId={user.id} isActive={user.is_active} />
            </div>
            <UserForm
              jobFunctions={jobFunctions ?? []}
              initial={{
                id: user.id,
                full_name: user.full_name,
                email: user.email ?? '',
                role: user.role,
                function_ids: (assigned ?? []).map((a) => a.function_id),
              }}
            />
          </>
        ) : (
          <p className="text-sm text-red-600">Không tìm thấy người dùng.</p>
        )}
      </section>
    </main>
  )
}
