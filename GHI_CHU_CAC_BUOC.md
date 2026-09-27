# Nhánh 3B — Quản lý sản phẩm/dịch vụ

## Trạng thái

- Các file route, Server Actions, form sản phẩm và quản lý nhóm nằm trong `app/admin/products/`.
- Link **Quản lý sản phẩm** cho admin nằm trong `app/layout.tsx`.
- Người vận hành xác nhận `supabase/migrations/008_nhom_va_ton_kho.sql` và
   `supabase/migrations/009_xoa_nhom_set_null.sql` đã chạy thành công trên Supabase ngày 2026-09-27.
- Build local đã chạy thành công. Trạng thái push và Vercel production phải kiểm tra riêng bằng GitHub/Vercel.

## Hành vi đã triển khai

- Quản lý danh mục sản phẩm/dịch vụ và thêm/sửa sản phẩm.
- Nhập kho qua `inventory_movements`; trigger cập nhật tồn kho và chặn tồn âm.
- Trigger trừ kho cho hàng đủ khi đơn thanh toán và cho hàng đặt trước khi chuyển sang đã giao.
- Migration `009` đặt `category_id` về `NULL` khi xóa danh mục.

## Chưa có trong UI

- Chưa có luồng bán hàng để đặt `order_items.fulfillment_status` thành `dat_truoc` hoặc `da_giao`.
- Chưa có cảnh báo đặt hàng vượt tồn kho hoặc màn hình xem lịch sử `inventory_movements`.
- Chưa gán danh mục cho licenses.

## Việc cần rà trước khi coi là production-ready

- `inventory_movements` hiện có policy cho phép mọi người dùng authenticated ghi trực tiếp; cần rà và siết RLS nếu nghiệp vụ yêu cầu chỉ admin được điều chỉnh kho.
- Product actions tra profile qua `auth_user_id`; đối chiếu với liên kết thực tế trong `users` và cách `lib/auth.ts` tra theo `id`.
- Một số thao tác upsert chưa kiểm tra lỗi Supabase; kiểm tra log và kết quả đọc lại khi thử nghiệm.
