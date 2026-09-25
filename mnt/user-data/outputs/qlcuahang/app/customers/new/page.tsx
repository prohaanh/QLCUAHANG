import CustomerForm from '@/components/CustomerForm'

export default function NewCustomerPage() {
  return (
    <main className="min-h-screen">
      <header className="border-b-2 border-board bg-board text-panel px-6 py-5">
        <h1 className="font-mono text-lg tracking-tight">Thêm khách hàng</h1>
      </header>
      <section className="px-6 py-8">
        <CustomerForm />
      </section>
    </main>
  )
}
