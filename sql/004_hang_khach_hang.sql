-- Nhánh 3A (mở rộng) — Hạng khách hàng (loyalty tier)
-- Chạy sau 003_nhanh3a_khach_hang.sql
-- Bảng cấu hình các hạng — cho phép chỉnh ngưỡng/ưu đãi mà không cần sửa code
create table if not exists customer_tiers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,              -- vd: Đồng, Bạc, Vàng, Kim Cương
  min_spend numeric not null default 0,   -- ngưỡng chi tiêu tích lũy (VNĐ) trong 12 tháng gần nhất
  discount_percent numeric not null default 0, -- % giảm giá mặc định khi lên đơn
  sort_order integer not null default 0,  -- thứ tự hạng, số lớn hơn = hạng cao hơn
  created_at timestamptz default now()
);

insert into customer_tiers (name, min_spend, discount_percent, sort_order) values
  ('Đồng',      0,        0, 0),
  ('Bạc',       2000000,  2, 1),
  ('Vàng',      10000000, 5, 2),
  ('Kim Cương', 30000000, 8, 3)
on conflict (name) do nothing;

-- View: tính chi tiêu 12 tháng gần nhất + hạng hiện tại của từng khách
-- (chỉ tính đơn đã thanh toán, để khách không còn hoạt động tự rớt hạng)
create or replace view customer_tier_view as
with spend as (
  select
    c.id as customer_id,
    coalesce(sum(o.total) filter (
      where o.status = 'da_thanh_toan'
        and o.created_at >= now() - interval '12 months'
    ), 0) as spend_12m
  from customers c
  left join orders o on o.customer_id = c.id
  group by c.id
)
select
  s.customer_id,
  s.spend_12m,
  t.name as tier_name,
  t.discount_percent,
  t.sort_order as tier_rank
from spend s
join lateral (
  select name, discount_percent, sort_order
  from customer_tiers
  where min_spend <= s.spend_12m
  order by min_spend desc
  limit 1
) t on true;

alter table customer_tiers enable row level security;
create policy "allow_authenticated_all" on customer_tiers for all using (true) with check (true);
