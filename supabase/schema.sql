-- QLCuaHang — Schema khởi tạo
-- Chạy nguyên file này trong Supabase SQL Editor (không cần sửa gì)

-- Người dùng / phân quyền
create table users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  role text not null check (role in ('admin', 'nhan_vien')),
  zalo_id text,
  created_at timestamptz default now()
);

-- Khách hàng
create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  note text,
  created_at timestamptz default now()
);

-- Sản phẩm / linh kiện
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  barcode text unique,
  price numeric not null default 0,
  stock_qty integer default 0,
  warranty_months integer default 0,
  created_at timestamptz default now()
);

-- Dịch vụ sửa chữa
create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  default_price numeric default 0,
  created_at timestamptz default now()
);

-- Phần mềm / tài khoản bản quyền (antivirus, Office, Windows, ChatGPT...)
create table licenses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  product_name text not null,
  license_key text,
  start_date date not null,
  expire_date date not null,
  created_at timestamptz default now()
);

-- View tính trạng thái license theo ngày hiện tại (thay cho generated column,
-- vì current_date không phải hàm immutable nên Postgres không cho phép dùng
-- trực tiếp trong generated column)
create view license_status as
select
  *,
  case when expire_date < current_date then 'het_han'
       when expire_date <= current_date + interval '7 day' then 'sap_het_han'
       else 'con_han' end as status
from licenses;

-- Đơn hàng (gộp sửa chữa + sản phẩm + phần mềm trong 1 đơn, cho phép mở/sửa)
create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  created_by uuid references users(id),
  status text not null default 'mo' check (status in ('mo', 'da_thanh_toan', 'huy')),
  total numeric default 0,
  qr_payment_ref text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Chi tiết đơn hàng: có thể là sản phẩm, dịch vụ, hoặc license
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  item_type text not null check (item_type in ('product', 'service', 'license')),
  product_id uuid references products(id),
  service_id uuid references services(id),
  license_id uuid references licenses(id),
  quantity integer default 1,
  unit_price numeric not null default 0,
  created_at timestamptz default now()
);

-- Yêu cầu thêm nhanh sản phẩm/dịch vụ/khách hàng chưa có trong hệ thống
create table quick_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid references users(id),
  request_type text not null check (request_type in ('product', 'service', 'customer')),
  content text not null,
  status text not null default 'cho_duyet' check (status in ('cho_duyet', 'da_duyet', 'tu_choi')),
  notified_channels text[], -- vd: {'zalo','telegram','in_app'}
  created_at timestamptz default now()
);

-- Bật Row Level Security (bảo mật cơ bản, có thể tinh chỉnh sau)
alter table users enable row level security;
alter table customers enable row level security;
alter table products enable row level security;
alter table services enable row level security;
alter table licenses enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table quick_requests enable row level security;

-- Policy tạm thời: cho phép người dùng đã đăng nhập đọc/ghi (sẽ siết chặt hơn ở Nhánh sau)
create policy "allow_authenticated_all" on users for all using (true) with check (true);
create policy "allow_authenticated_all" on customers for all using (true) with check (true);
create policy "allow_authenticated_all" on products for all using (true) with check (true);
create policy "allow_authenticated_all" on services for all using (true) with check (true);
create policy "allow_authenticated_all" on licenses for all using (true) with check (true);
create policy "allow_authenticated_all" on orders for all using (true) with check (true);
create policy "allow_authenticated_all" on order_items for all using (true) with check (true);
create policy "allow_authenticated_all" on quick_requests for all using (true) with check (true);
