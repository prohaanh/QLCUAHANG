# QLCuaHang — Nhánh 3A: Khách hàng (hạng, lịch sử, ngừng theo dõi)

## Đã kiểm chứng trước khi viết
- `customers` (đủ cột: cccd, dob, gender, address, zalo_id, is_active...), `customer_tiers`,
  `job_functions`... đã có sẵn trong DB thật theo schema bạn gửi — không cần tạo lại các bảng này.
- Các migration hạng khách hàng cũ không có trong repo hiện tại. Các số `004` đến `006` đã được dùng,
  vì vậy migration tính hạng của nhánh này dùng số `007`.

## File trong bản này

**Mới:**
- `supabase/migrations/007_hang_khach_hang.sql` — thêm 4 hạng mặc định (Đồng/Bạc/Vàng/Kim Cương) + view
  `customer_tier_view` (tính chi tiêu 12 tháng dựa trên đơn `da_thanh_toan` + hạng tương ứng)
- `app/customers/page.tsx` — danh sách khách hàng, có badge hạng, lọc khách ngừng theo dõi
- `app/customers/new/page.tsx`, `app/customers/new/actions.ts` — form thêm khách hàng
- `app/customers/[id]/page.tsx` — chi tiết khách: thông tin, hạng + chi tiêu 12 tháng, lịch sử đơn hàng,
  phần mềm/bản quyền đã cấp, nút ngừng/khôi phục theo dõi

**Sửa:**
- `components/ToggleActiveButton.tsx` — viết lại nội dung thật (trước đây chỉ re-export từ file gốc);
  đổi sang dùng `lib/supabase/browser.ts` (client chuẩn đang dùng ở trang đăng nhập) thay vì `lib/supabase.ts`
  cũ, cho thống nhất 1 chuẩn duy nhất
- `app/layout.tsx` — thêm link "khách hàng" cho mọi nhân viên đã đăng nhập (không riêng admin)

## 🔴 Việc cần làm

1. **Xoá file `ToggleActiveButton.tsx` ở ngay thư mục gốc repo** (không phải trong `components/`) — file đó
   chỉ re-export sang bản cũ, không cần nữa, để tránh 2 bản song song.
2. Giải nén đè các file còn lại vào đúng vị trí.
3. Chạy `supabase/migrations/007_hang_khach_hang.sql` trong Supabase SQL Editor.
4. `git add . && git commit -m "Nhánh 3A: khách hàng - hạng, lịch sử, ngừng theo dõi" && git push`
5. Build xong, vào `/customers` kiểm tra: thêm 1 khách test, tạo 1 đơn hàng đã thanh toán cho khách đó
   (qua Supabase Table Editor nếu chưa có trang tạo đơn) để thấy hạng tự tính lên.

## Chưa làm (để sau)

- Chưa có trang tạo/sửa đơn hàng thật (`/orders`) — nhánh riêng, "chi tiêu 12 tháng" hiện chỉ tính được
  khi có dữ liệu `orders` thật.
- Chưa có quét CCCD/QR để nhập khách nhanh — form thêm khách hiện là nhập tay.
- Chưa cảnh báo trùng tên gần giống (mới chặn trùng CCCD tuyệt đối qua ràng buộc unique có sẵn).
- Chưa có nút gọi/nhắn Zalo nhanh ở trang chi tiết khách.
