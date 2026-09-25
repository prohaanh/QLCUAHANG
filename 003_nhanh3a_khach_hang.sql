-- Nhánh 3A — Quản lý khách hàng
-- Chạy trong Supabase SQL Editor (chạy sau khi đã có schema.sql gốc)

alter table customers
  add column if not exists cccd text unique,
  add column if not exists dob date,
  add column if not exists gender text,
  add column if not exists address text,
  add column if not exists zalo_id text,
  add column if not exists cmnd_cu text,
  add column if not exists updated_at timestamptz default now();

-- Tìm khách nhanh theo tên/sđt/cccd
create index if not exists idx_customers_search
  on customers using gin (
    to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(phone, '') || ' ' || coalesce(cccd, ''))
  );
