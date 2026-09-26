# QLCuaHang — Vá lỗi build + Nhánh Quản lý người dùng

## Phát hiện khi rà soát repo thật (không dựa vào ghi chú cũ)

Repo GitHub hiện tại **build bị gãy** — đây là lý do chính khiến qlcuahang.vercel.app
vẫn hiện bản cũ, không có màn hình đăng nhập, dù code đăng nhập đã có:

- `app/page.tsx` (bản đang ở GitHub) import từ `@/lib/supabase-server` — file này **không tồn tại**.
- `app/layout.tsx` import `@/components/LogoutButton` — file này cũng **không tồn tại**.

→ Next.js không build được, nên Vercel vẫn phục vụ bản deploy thành công gần nhất (bản chưa có đăng nhập).

Ngoài ra: toàn bộ code của **Nhánh 3A (hạng khách hàng, /customers...)** và **Nhánh quản lý người dùng
(job functions, /users...)** được ghi trong ghi chú là "đã code xong" nhưng **không có trên GitHub** —
khả năng cao là code đó chỉ tồn tại ở máy bạn (local) và chưa từng `git push`, hoặc đã push nhưng lên
nhánh khác không phải `main`. Đây nhiều khả năng chính là phần "phát sinh không kiểm soát" bạn nhắc tới:
hai phiên làm việc khác nhau đặt tên file khác nhau cho cùng một thứ (`lib/supabase/server.ts` vs
`lib/supabase-server.ts`), nên khi ghép lại bị lệch.

**Quyết định xử lý trong bản này:** giữ đúng 1 kiểu đặt tên đang thật sự có trên GitHub
(`lib/supabase/server.ts`, `lib/supabase/admin.ts`...), sửa 2 file bị gãy theo đúng kiểu đó, và
**không đụng tới Nhánh 3A** (khách hàng) — phần đó cần làm lại từ đầu ở lượt sau nếu bạn xác nhận local
không còn giữ code cũ.

## File trong bản vá này

**Sửa (vá lỗi build):**
- `app/page.tsx` — sửa import về đúng `@/lib/supabase/server`
- `components/LogoutButton.tsx` — tạo lại file bị thiếu
- `app/layout.tsx` — giữ nguyên phần đăng nhập/đăng xuất, thêm link "quản lý người dùng" cho admin

**Mới (Nhánh quản lý người dùng):**
- `supabase/migrations/003_chuc_nang_va_khoa_tai_khoan.sql`
- `app/admin/users/page.tsx`, `app/admin/users/actions.ts` — mở rộng trang có sẵn từ Nhánh 2, KHÔNG tạo trang `/users` riêng để tránh trùng lặp 2 hệ thống quản lý người dùng như ghi chú cũ định làm

## Tính năng mới ở trang "quản lý người dùng" (`/admin/users`)

- Gán nhiều chức năng công việc cho 1 người: Nhập hàng, Bán hàng, Kế toán, Sửa chữa, Bảo hành, Tư vấn & hỗ trợ khách
- Khoá / mở khoá tài khoản — khoá thật ở tầng đăng nhập (Supabase Auth), không chỉ ẩn trên giao diện; không thể tự khoá chính mình

## 🔴 Việc bạn cần làm

1. **Giải nén đè** vào thư mục repo local.
2. Chạy migration mới trong Supabase SQL Editor: `supabase/migrations/003_chuc_nang_va_khoa_tai_khoan.sql`
   (không cần chạy lại migration 002, đã chạy rồi).
3. `git add . && git commit -m "vá lỗi build + nhánh quản lý người dùng" && git push`
4. Vào Vercel xem deployment mới build **thành công** chưa (đây là bước quan trọng nhất để xác nhận đã hết gãy build) — nếu vẫn lỗi, dán nguyên log ở đây.
5. Sau khi build xanh, vào lại https://qlcuahang.vercel.app/ — phải thấy màn hình đăng nhập ngay.

## Câu hỏi cần bạn trả lời để làm tiếp Nhánh 3A

Vì code Nhánh 3A không có trên GitHub, mình cần biết: máy bạn (local) còn giữ code cũ của Nhánh 3A không
(coi trong thư mục `app/customers`, `components/ToggleActiveButton.tsx`)? Nếu còn — gửi lại để mình rà
soát và ghép cho khớp thay vì viết lại từ đầu. Nếu không còn, báo mình viết lại theo đúng thiết kế đã lưu.
