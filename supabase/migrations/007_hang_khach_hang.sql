-- QLCuaHang — Nhánh 3A: hạng khách hàng (loyalty tier)
-- Chạy nguyên file này trong Supabase SQL Editor (không cần sửa gì)
-- Ghi chú: bảng customer_tiers và cột customers.is_active ĐÃ CÓ SẴN trong DB thật (kiểm chứng qua
-- schema dump 2026-09-27) — file này chỉ thêm dữ liệu mặc định + view, không tạo lại bảng.
-- An toàn khi chạy lại nhiều lần.

-- Ngưỡng mặc định — chỉnh trực tiếp trong bảng này sau, không cần sửa code
insert into customer_tiers (name, min_spend, discount_percent, sort_order)
values
  ('Đồng', 0, 0, 1),
  ('Bạc', 2000000, 2, 2),
  ('Vàng', 10000000, 5, 3),
  ('Kim Cương', 30000000, 8, 4)
on conflict (name) do nothing;

-- View đã tồn tại sẵn từ trước với cấu trúc cột khác (không rõ nguồn gốc) — xoá hẳn rồi tạo lại theo
-- đúng thiết kế hiện tại. Nếu có view phụ thuộc, dừng để xử lý dependency rõ ràng.
drop view if exists customer_tier_view;

-- View: tổng chi tiêu đơn đã thanh toán trong 12 tháng gần nhất + hạng hiện tại của từng khách
-- security_invoker: view chạy theo quyền người gọi (tôn trọng RLS của customers/orders), không bypass
create view customer_tier_view
with (security_invoker = true) as
select
  c.id as customer_id,
  coalesce(spend.total_12m, 0) as spend_12m,
  tier.id as tier_id,
  tier.name as tier_name,
  tier.discount_percent
from customers c
left join (
  select customer_id, sum(total) as total_12m
  from orders
  where status = 'da_thanh_toan'
    and created_at >= now() - interval '12 months'
  group by customer_id
) spend on spend.customer_id = c.id
left join lateral (
  select id, name, discount_percent
  from customer_tiers
  where min_spend <= coalesce(spend.total_12m, 0)
  order by min_spend desc
  limit 1
) tier on true;

grant select on customer_tier_view to authenticated;