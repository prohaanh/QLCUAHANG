# QLCuaHang — Nối tiếp trên đúng code thật GitHub

Đã đồng bộ lại theo đúng những gì đang thật sự chạy trên `main`, không dùng lại bản zip cũ nữa.

## Đã đối chiếu và xác nhận

- `supabase/migrations/002_dang_nhap_phan_quyen.sql` và
  `supabase/migrations/003_chuc_nang_va_khoa_tai_khoan.sql` đã có sẵn trên GitHub — tức bảng
  `job_functions`, `user_job_functions`, cột `users.is_active` **đã tồn tại trong database** (không cần
  chạy SQL gì thêm ở đợt này).
- Nhưng `app/admin/users/page.tsx` và `actions.ts` trên GitHub vẫn là **bản Nhánh 2 gốc**, chưa dùng tới
  3 thứ đó — đây là phần còn thiếu, khớp với việc "làm tiếp phần quản lý người dùng".

## File vá lần này (2 file, sửa trên đúng bản gốc đang có trên GitHub)

- `app/admin/users/page.tsx`
- `app/admin/users/actions.ts`

Thêm: gán chức năng công việc (Nhập hàng, Bán hàng, Kế toán, Sửa chữa, Bảo hành, Tư vấn & hỗ trợ khách)
cho từng người, và khoá/mở khoá tài khoản (khoá thật ở tầng đăng nhập, không thể tự khoá chính mình).

## Việc cần làm

1. Giải nén đè 2 file vào đúng vị trí trong repo.
2. `git add . && git commit -m "hoàn thiện quản lý người dùng: chức năng công việc + khoá tài khoản" && git push`
3. Vercel build xong → vào `/admin/users` kiểm tra.

## Ghi nhận thêm (không chặn việc trên, chỉ để bạn biết)

- Repo đang có **2 file tạo Supabase client cho server** cùng lúc: `lib/supabase-server.ts` (đang được
  `app/page.tsx` dùng) và `lib/supabase/server.ts` (đang được `app/admin/users`, `lib/auth.ts` dùng). Cả
  hai đều chạy được, không xung đột, nhưng là 2 chuẩn song song — dễ gây nhầm ở các nhánh sau. Có thể gộp
  làm 1 khi rảnh, không gấp.
- `lib/auth.ts` có đoạn dự phòng tìm theo cột `auth_user_id` nếu không thấy theo `id` — hiện không có
  migration nào tạo cột này, nên nhánh dự phòng đó nhiều khả năng không bao giờ chạy tới. Không gây lỗi gì
  ở trạng thái hiện tại, chỉ là code thừa.
- `package.json` có sẵn `html5-qrcode` nhưng chưa có file nào dùng tới — có thể là chuẩn bị trước cho tính
  năng quét CCCD ở Nhánh 3A, hiện vẫn chưa có code phần đó trên GitHub.
