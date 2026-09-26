# QLCuaHang — Nhánh 2: Đăng nhập & phân quyền

File này ghi lại chính xác những việc bạn cần tự tay làm. Code đã viết sẵn hết.

## File mới / đã sửa trong bản này

**Mới:**
- `middleware.ts` — chặn mọi trang khi chưa đăng nhập, tự chuyển về `/login`
- `lib/supabase/browser.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`, `lib/supabase/admin.ts`
- `lib/auth.ts` — lấy thông tin người đang đăng nhập + vai trò (admin / nhân viên)
- `app/login/page.tsx`, `app/login/login-form.tsx` — trang đăng nhập
- `app/logout/route.ts` — đăng xuất
- `app/admin/users/page.tsx`, `app/admin/users/actions.ts` — trang quản lý người dùng (chỉ admin thấy được), tạo tài khoản mới + đổi vai trò
- `supabase/migrations/002_dang_nhap_phan_quyen.sql` — script SQL cho Nhánh này

**Đã sửa:**
- `app/page.tsx` — thêm khung hiển thị tên người đăng nhập, vai trò, nút đăng xuất, link "quản lý người dùng" (nếu là admin); đổi sang dùng client có phiên đăng nhập thay vì client ẩn danh cũ
- `package.json` — thêm gói `@supabase/ssr`

---

## 🔴 CẦN BẠN LÀM — theo đúng thứ tự

### 1. Chạy SQL migration

Vào Supabase → **SQL Editor** → New query → paste toàn bộ nội dung file
`supabase/migrations/002_dang_nhap_phan_quyen.sql` → Run.

Script này sẽ:
- Gắn bảng `users` với hệ thống đăng nhập của Supabase (`auth.users`)
- Tự động tạo hàng `users` (vai trò mặc định **nhân viên**) mỗi khi có tài khoản đăng nhập mới
- Xoá policy "cho phép hết" tạm thời của Nhánh 1, thay bằng quy tắc: ai đăng nhập cũng đọc/ghi được dữ liệu nghiệp vụ, **chỉ admin mới được xoá** và **chỉ admin mới đổi được vai trò người khác**

### 2. Tạo tài khoản admin đầu tiên

Vì lúc này hệ thống chưa có ai để tự tạo người dùng khác, bạn cần tạo tay **một lần duy nhất**:

1. Vào Supabase → **Authentication → Users → Add user** → nhập email + mật khẩu cho chính bạn → **Create user** (tick "Auto Confirm User" nếu có).
2. Vào **SQL Editor**, chạy lệnh sau (đổi email cho đúng email vừa tạo):
   ```sql
   update public.users set role = 'admin'
   where id = (select id from auth.users where email = 'email-cua-ban@vidu.com');
   ```
3. Xong — đăng nhập vào web bằng email/mật khẩu này, bạn sẽ thấy link **"quản lý người dùng"** ở góc trên bên phải để tạo thêm tài khoản cho 4 người còn lại, không cần vào Supabase nữa.

### 3. Cài đặt gói mới & chạy thử

```
npm install
npm run dev
```

Mở <http://localhost:3000> — sẽ tự chuyển sang trang đăng nhập nếu chưa có phiên.

### 4. Push code + redeploy Vercel

```
git add .
git commit -m "Nhánh 2: đăng nhập và phân quyền"
git push
```

Vercel sẽ tự build lại (đã cài sẵn env từ Nhánh 1, không cần thêm biến môi trường nào mới).

---

## Cách phân quyền hoạt động

| | nhân viên | admin |
|---|---|---|
| Đăng nhập, xem dashboard | ✅ | ✅ |
| Thêm/sửa khách hàng, sản phẩm, dịch vụ, license, đơn hàng | ✅ | ✅ |
| Xoá bất kỳ dữ liệu nào | ❌ | ✅ |
| Tạo tài khoản mới, đổi vai trò người khác | ❌ | ✅ trang `/admin/users` |

Việc kiểm tra quyền nằm ở **2 lớp**: giao diện (ẩn link admin, chặn trang) và **ngay trong database** (Row Level Security) — nên dù ai đó cố gọi thẳng API cũng không vượt được.

## Ghi chú

- Chưa làm đăng nhập qua Zalo — cột `zalo_id` trong bảng `users` vẫn còn đó để dùng sau này cho việc gửi thông báo, không phải để đăng nhập.
- Quên mật khẩu: hiện chưa có form "quên mật khẩu" tự phục vụ — admin có thể vào Supabase Dashboard → Authentication → Users → chọn người đó → **Send password recovery** hoặc đổi mật khẩu tay. Có thể làm form tự phục vụ ở nhánh sau nếu cần.
