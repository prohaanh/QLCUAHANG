# Nhánh 4A — Quét mã vạch / QR

Không có migration mới. Toàn bộ là file mới, không sửa file cũ nào.

## Các bước

1. Cài thư viện quét:
   ```
   npm i html5-qrcode
   ```
2. Chép các file vào đúng chỗ trong repo:
   - `components/BarcodeScanner.tsx`
   - `lib/scan-styles.ts`
   - `lib/cccd.ts`
   - `app/admin/products/scan/page.tsx`
   - `app/customers/scan/page.tsx`
3. Mở `lib/supabase/browser.ts`, xem hàm export tên gì. Nếu không phải `createClient` thì sửa dòng
   `import { createClient } from '@/lib/supabase/browser'` ở 2 trang `scan/page.tsx`.
4. Chạy câu này trên Supabase, đối chiếu tên cột họ tên/SĐT của bảng `customers`:
   ```sql
   select column_name, data_type
   from information_schema.columns
   where table_schema = 'public' and table_name = 'customers'
   order by ordinal_position;
   ```
   Nếu khác `full_name` / `phone` thì sửa 2 hằng `COL_NAME`, `COL_PHONE` đầu file `app/customers/scan/page.tsx`.
5. Thêm 2 link vào giao diện (tự đặt chỗ hợp lý):
   - Trang `/admin/products`: `<Link href="/admin/products/scan">📷 Quét mã vạch</Link>`
   - Trang `/customers`: `<Link href="/customers/scan">📷 Thêm khách bằng CCCD</Link>`
6. Push GitHub, chờ Vercel build xanh.

## Cách dùng

- `/admin/products/scan`: quét mã vạch → có sẵn thì hiện giá/tồn/bảo hành + ô nhập thêm kho; chưa có thì hiện form thêm nhanh (mã vạch điền sẵn).
- `/customers/scan`: quét QR trên CCCD gắn chip → tự điền họ tên, ngày sinh, giới tính, địa chỉ, số CCCD; nhập thêm SĐT rồi lưu. Trùng số CCCD thì mở hồ sơ khách cũ.
- Máy quét mã vạch cầm tay (USB/Bluetooth): bấm vào ô "Hoặc dùng máy quét…" rồi quét, máy tự gõ mã và nhấn Enter.

## Lưu ý

- Camera chỉ chạy trên HTTPS (Vercel đã có) và phải cho phép quyền camera.
- QR CCCD chỉ đọc được trên thẻ CCCD gắn chip; CMND 9 số và CCCD cũ không có QR đúng định dạng này.
- Tồn đầu khi thêm sản phẩm đi qua `inventory_movements` (loại `nhap`) nên vẫn có lịch sử kho.

## Kết quả chạy local ngày 2026-09-28

- `html5-qrcode` đã có trong `package.json` và lockfile; không cần cài lại.
- `lib/supabase/browser.ts` export `createClient` như hai trang scan đang import.
- Dữ liệu khách trong các trang hiện tại dùng cột `name` và `phone`; trang scan đã map tên sang `name`. Tra cứu CCCD giả chạy tới form, không phát sinh lỗi cột.
- Hai link scan hiển thị từ `/admin/products` và `/customers`.
- Thử barcode giả và QR CCCD giả: cả hai tới đúng form nhập liệu. Không bấm lưu, không tạo sản phẩm/khách và không nhập kho vì local đang nối Supabase dùng chung.
- `npm run build` thành công.
- Chưa kiểm tra camera thật/quyền camera, QR trên thẻ thật, ghi dữ liệu hay trùng CCCD; cần làm trong môi trường test riêng.
- Các file scan mới và sửa mapping/link hiện là thay đổi local; chưa push GitHub.

## Dữ liệu demo đơn hàng ngày 2026-10-01

Người vận hành đã cho phép dùng Supabase project hiện cấu hình làm demo. Các bản ghi sau được tạo để kiểm tra bước sản phẩm/dịch vụ và đơn hàng:

- Product `DEMO-20261001-PRODUCT-001`: giá 5.000, bảo hành 1 tháng, tồn đầu 5; tạo qua luồng barcode quick-entry. History ghi `nhap +5`.
- Service `DEMO-20261001-DICH-VU-001`: giá 10.000.
- Order `41fe289b-8358-49f0-85aa-1f3b90a7715c`: 3 sản phẩm + 2 dịch vụ; `orders.total` đọc lại là 35.000. Xóa/thêm lại dịch vụ làm tổng đổi 35.000 → 15.000 → 35.000. Thanh toán tạo đúng một movement `xuat -3`, tồn 5 → 2.
- Một order đặt trước số lượng 4 khi tồn 2 được hủy; tồn vẫn 2, không phát sinh movement.
- Một order khác thanh toán bằng thao tác double-click tạo đúng một movement `xuat -1`, tồn 2 → 1.

Các order cũ từ 2026-09-28 chưa được phân loại; không xóa hoặc sửa trước khi người vận hành xác nhận. Demo này chưa kiểm tra chỉnh sửa dịch vụ/sản phẩm, giá license, refund, camera thật, hoặc direct API guard. `010_order_totals_and_terminal_states.sql` đã được người vận hành xác nhận chạy thành công trên Supabase.
