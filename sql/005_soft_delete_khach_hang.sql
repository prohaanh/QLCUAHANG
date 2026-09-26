-- Nhánh 3A (mở rộng) — Soft delete khách hàng
-- Chạy sau 004_hang_khach_hang.sql

alter table customers
  add column if not exists is_active boolean not null default true;

-- Khách ngừng theo dõi vẫn giữ nguyên trong orders/licenses (không xoá cứng,
-- tránh vỡ dữ liệu liên quan), chỉ ẩn khỏi danh sách mặc định.
create index if not exists idx_customers_is_active on customers (is_active);
