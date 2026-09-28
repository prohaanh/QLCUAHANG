# Nhánh Đơn hàng (/orders) + Lịch sử tồn kho + Đặt trước/Đã giao

## Đã làm trong bản này
- `app/orders/page.tsx` — danh sách đơn hàng, nút "Tạo đơn mới"
- `app/orders/actions.ts` — Server Actions: createOrder, addOrderItem, removeOrderItem,
  updateOrderStatus, updateItemFulfillment, searchCatalog
- `app/orders/[id]/page.tsx` + `OrderDetailClient.tsx` — chi tiết đơn: thêm sản phẩm/dịch
  vụ/license, đổi trạng thái thanh toán (`mo`/`da_thanh_toan`/`huy`), và với từng dòng sản
  phẩm có dropdown đổi trạng thái giao hàng (`dat_truoc`/`du_hang`/`da_giao`)
- `app/admin/products/[id]/history/page.tsx` — lịch sử `inventory_movements` của 1 sản phẩm

## Kết quả rà soát local ngày 2026-09-27

1. ✅ Các route trong `app/orders/` và `app/admin/products/[id]/history/` đã có trong repo.
2. ✅ Đã thêm link **Lịch sử kho** vào từng sản phẩm tại `/admin/products`.
3. ✅ `npm run build` thành công; `/orders` mở được bằng phiên admin và hiển thị trạng thái chưa có đơn.
4. ⚠️ Chưa tạo đơn hoặc sửa trạng thái/tồn kho: `.env.local` đang nối tới Supabase dùng chung, không phải database test. Cần test ghi dữ liệu trong môi trường test riêng.
5. ℹ️ Kiểm tra commit trên GitHub và trạng thái deploy trong Vercel riêng; push thành công không tự xác nhận production đã cập nhật.

## Cách kiểm thử nghiệp vụ còn lại

Trên database test, tạo đơn, thêm sản phẩm có tồn kho đủ và thiếu, thử thanh toán, rồi thử chuyển đặt trước sang đã giao. Sau mỗi thao tác, đọc lại `orders`, `order_items`, `products.stock_qty` và `inventory_movements` để xác nhận trigger. Không chạy các thao tác này trên database thật chỉ để thử.

## Điểm cần lưu ý khi test
- Khi 1 dòng sản phẩm đang `dat_truoc` mà đơn chuyển sang `da_thanh_toan`, trigger thanh toán
   không trừ kho ngay. Tuy nhiên trigger chuyển sang `da_giao` hiện không kiểm tra trạng thái đơn,
   dù comment trong code nói chỉ trừ nếu đơn đã thanh toán. Cần xác nhận và sửa/kiểm thử logic này.
- Khi thêm 1 dòng sản phẩm mới, code tự kiểm tra `stock_qty` để set `dat_truoc` hay
  `du_hang` ngay từ đầu.
