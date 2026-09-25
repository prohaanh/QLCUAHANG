-- QLCuaHang — Nhánh Quản lý người dùng: chức năng công việc + khoá tài khoản
-- Chạy nguyên file này trong Supabase SQL Editor (không cần sửa gì)
-- Yêu cầu: đã chạy xong supabase/migrations/002_dang_nhap_phan_quyen.sql trước đó.
-- File này viết theo kiểu chạy lại nhiều lần không lỗi (an toàn nếu lỡ chạy 2 lần).

-- 1) Danh mục chức năng công việc
create table if not exists job_functions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0
);

insert into job_functions (name, sort_order)
values
  ('Nhập hàng', 1),
  ('Bán hàng', 2),
  ('Kế toán', 3),
  ('Sửa chữa', 4),
  ('Bảo hành', 5),
  ('Tư vấn & hỗ trợ khách', 6)
on conflict (name) do nothing;

-- 2) Gán chức năng cho người dùng — 1 người có thể nhiều chức năng
create table if not exists user_job_functions (
  user_id uuid not null references users(id) on delete cascade,
  job_function_id uuid not null references job_functions(id) on delete cascade,
  primary key (user_id, job_function_id)
);

-- 3) "Xoá" người dùng = ẩn khỏi danh sách + khoá đăng nhập thật (không xoá cứng dữ liệu)
alter table users add column if not exists is_active boolean not null default true;

-- 4) RLS
alter table job_functions enable row level security;
alter table user_job_functions enable row level security;

drop policy if exists "job_functions_select" on job_functions;
create policy "job_functions_select" on job_functions
  for select using (auth.role() = 'authenticated');

drop policy if exists "job_functions_write_admin_only" on job_functions;
create policy "job_functions_write_admin_only" on job_functions
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "user_job_functions_select" on user_job_functions;
create policy "user_job_functions_select" on user_job_functions
  for select using (auth.role() = 'authenticated');

drop policy if exists "user_job_functions_write_admin_only" on user_job_functions;
create policy "user_job_functions_write_admin_only" on user_job_functions
  for all using (public.is_admin()) with check (public.is_admin());
