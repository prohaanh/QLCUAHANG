import { createCustomer } from './actions'

export default function NewCustomerPage() {
  return (
    <main className="min-h-screen">
      <header className="border-b-2 border-board bg-board text-panel px-6 py-5 flex items-baseline justify-between">
        <h1 className="font-mono text-lg tracking-tight">Thêm khách hàng</h1>
        <a href="/customers" className="font-mono text-xs text-copper hover:underline">
          ← danh sách khách hàng
        </a>
      </header>

      <section className="px-6 py-10 max-w-sm">
        <form action={createCustomer} className="flex flex-col gap-3">
          <input
            name="name"
            placeholder="Họ tên *"
            required
            className="border border-board/30 bg-white px-3 py-2 text-sm"
          />
          <input
            name="phone"
            placeholder="Số điện thoại"
            className="border border-board/30 bg-white px-3 py-2 text-sm font-mono"
          />
          <input
            name="cccd"
            placeholder="Số CCCD"
            className="border border-board/30 bg-white px-3 py-2 text-sm font-mono"
          />
          <div className="flex gap-3">
            <input
              name="dob"
              type="date"
              placeholder="Ngày sinh"
              className="border border-board/30 bg-white px-3 py-2 text-sm font-mono flex-1"
            />
            <select
              name="gender"
              defaultValue=""
              className="border border-board/30 bg-white px-3 py-2 text-sm font-mono"
            >
              <option value="">Giới tính</option>
              <option value="nam">Nam</option>
              <option value="nu">Nữ</option>
              <option value="khac">Khác</option>
            </select>
          </div>
          <input
            name="address"
            placeholder="Địa chỉ"
            className="border border-board/30 bg-white px-3 py-2 text-sm"
          />
          <input
            name="zalo_id"
            placeholder="Zalo (số điện thoại hoặc ID)"
            className="border border-board/30 bg-white px-3 py-2 text-sm font-mono"
          />
          <textarea
            name="note"
            placeholder="Ghi chú"
            rows={3}
            className="border border-board/30 bg-white px-3 py-2 text-sm"
          />

          <button
            type="submit"
            className="mt-2 bg-board text-panel py-2 text-sm font-mono tracking-tight hover:bg-boardline transition-colors"
          >
            Lưu khách hàng
          </button>
        </form>
      </section>
    </main>
  )
}
