-- Nhánh Quản lý người dùng — chức năng công việc (nhập hàng, bán hàng, kế toán,
-- sửa chữa, bảo hành, tư vấn khách...), 1 người có thể có nhiều chức năng.
-- Chạy sau 002_dang_nhap.sql.

create table if not exists job_functions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0
);

insert into job_functions (name, sort_order) values
  ('Nhập hàng', 0),
  ('Bán hàng', 1),
  ('Kế toán', 2),
  ('Sửa chữa', 3),
  ('Bảo hành', 4),
  ('Tư vấn & hỗ trợ khách', 5)
on conflict (name) do nothing;

-- 1 người có thể có nhiều chức năng (many-to-many)
create table if not exists user_job_functions (
  user_id uuid not null references users(id) on delete cascade,
  function_id uuid not null references job_functions(id) on delete cascade,
  primary key (user_id, function_id)
);

alter table users
  add column if not exists is_active boolean not null default true;

alter table job_functions enable row level security;
alter table user_job_functions enable row level security;
drop policy if exists "allow_authenticated_all" on job_functions;
drop policy if exists "allow_authenticated_all" on user_job_functions;
create policy "allow_authenticated_all" on job_functions for all using (true) with check (true);
create policy "allow_authenticated_all" on user_job_functions for all using (true) with check (true);
