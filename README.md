# QLCuaHang — Hạ tầng (Nhánh 1)

File này ghi lại **chính xác những chỗ cần bạn tự tay sửa** sau khi tạo Supabase project và deploy Vercel. Mọi phần code/cấu hình khác đã được tạo sẵn tự động.

---

## ✅ Đã tự động hoá (không cần đụng vào)
- `.env.example` — mẫu biến môi trường
- `lib/supabase.ts` — client kết nối Supabase (đọc từ biến môi trường, không cần sửa)
- `supabase/schema.sql` — toàn bộ bảng database ban đầu (khách hàng, sản phẩm, đơn hàng, dịch vụ, phần mềm bản quyền...)
- `vercel.json` — cấu hình deploy Vercel

## 🔴 CẦN BẠN SỬA — 3 chỗ duy nhất

### 1. Sau khi tạo Supabase project
Vào **Project Settings → API**, copy 3 giá trị, dán vào file `.env.local` (tạo file này ở gốc project, copy từ `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=<dán Project URL vào đây>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<dán anon public key vào đây>
SUPABASE_SERVICE_ROLE_KEY=<dán service_role key vào đây — KHÔNG public>
```

### 2. Chạy schema vào Supabase
Vào Supabase → **SQL Editor** → New query → paste toàn bộ nội dung file `supabase/schema.sql` → Run.
(Không cần sửa gì trong file này, chạy y nguyên.)

### 3. Sau khi deploy Vercel
Vào project trên Vercel → **Settings → Environment Variables** → dán đúng 3 biến ở mục 1 (copy y hệt từ `.env.local`) → Redeploy.

---

## Thứ tự thao tác thủ công (không tự động được)
1. ✅ Đã tạo Supabase project, đã chạy schema.
2. Push code này lên GitHub repo của bạn (đã có `.gitignore` chặn lộ key).
3. Import repo vào Vercel → điền mục 1 ở trên vào Environment Variables → Deploy.

## Chạy thử ở máy bạn trước khi push (không bắt buộc)
```
npm install
npm run dev
```
Mở http://localhost:3000 — trang dashboard sẽ hiện số liệu thật lấy từ Supabase (ban đầu sẽ toàn số 0 vì chưa có dữ liệu).

## Ghi chú
- `public/manifest.json` chưa có icon — thêm icon 192x192 và 512x512 vào `public/` rồi khai báo trong manifest khi cần cài PWA thật lên điện thoại (bỏ qua được ở giai đoạn này).
- Trang hiện tại (`app/page.tsx`) chỉ là dashboard đọc dữ liệu — chưa có form nhập liệu, quét mã, đăng nhập. Đó là Nhánh 2.

Sau khi có domain Vercel chạy được, báo mình để làm tiếp Nhánh 2 (giao diện nhập liệu, quét mã vạch/QR...).
