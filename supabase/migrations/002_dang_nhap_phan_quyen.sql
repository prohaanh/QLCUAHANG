-- QLCuaHang — Nhánh 2: Đăng nhập & phân quyền
-- Chạy nguyên file này trong Supabase SQL Editor (không cần sửa gì)
-- Yêu cầu: đã chạy xong supabase/schema.sql (Nhánh 1) trước đó.

-- 1) Gắn public.users vào auth.users (mỗi tài khoản đăng nhập = 1 hàng ở public.users)
alter table public.users
  alter column id drop default;

alter table public.users
  add constraint users_id_fkey foreign key (id) references auth.users(id) on delete cascade;

-- 2) Tự động tạo hàng public.users khi có tài khoản đăng nhập mới (mặc định role nhân viên)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'nhan_vien'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3) Hàm kiểm tra quyền admin (dùng trong policy)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'admin'
  );
$$;

-- 4) Xoá policy tạm "cho phép hết" của Nhánh 1, thay bằng policy theo vai trò
drop policy if exists "allow_authenticated_all" on users;
drop policy if exists "allow_authenticated_all" on customers;
drop policy if exists "allow_authenticated_all" on products;
drop policy if exists "allow_authenticated_all" on services;
drop policy if exists "allow_authenticated_all" on licenses;
drop policy if exists "allow_authenticated_all" on orders;
drop policy if exists "allow_authenticated_all" on order_items;
drop policy if exists "allow_authenticated_all" on quick_requests;

-- users: ai đăng nhập cũng xem được danh sách (để hiện tên người tạo đơn...),
-- nhưng chỉ admin mới sửa/xoá/đổi vai trò người khác.
create policy "users_select" on users
  for select using (auth.role() = 'authenticated');
create policy "users_update_admin_only" on users
  for update using (public.is_admin()) with check (public.is_admin());
create policy "users_delete_admin_only" on users
  for delete using (public.is_admin());

-- Các bảng nghiệp vụ: nhân viên đọc/ghi bình thường, chỉ admin được xoá.
create policy "customers_rw" on customers
  for select using (auth.role() = 'authenticated');
create policy "customers_insert" on customers
  for insert with check (auth.role() = 'authenticated');
create policy "customers_update" on customers
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "customers_delete_admin_only" on customers
  for delete using (public.is_admin());

create policy "products_rw" on products
  for select using (auth.role() = 'authenticated');
create policy "products_insert" on products
  for insert with check (auth.role() = 'authenticated');
create policy "products_update" on products
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "products_delete_admin_only" on products
  for delete using (public.is_admin());

create policy "services_rw" on services
  for select using (auth.role() = 'authenticated');
create policy "services_insert" on services
  for insert with check (auth.role() = 'authenticated');
create policy "services_update" on services
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "services_delete_admin_only" on services
  for delete using (public.is_admin());

create policy "licenses_rw" on licenses
  for select using (auth.role() = 'authenticated');
create policy "licenses_insert" on licenses
  for insert with check (auth.role() = 'authenticated');
create policy "licenses_update" on licenses
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "licenses_delete_admin_only" on licenses
  for delete using (public.is_admin());

create policy "orders_rw" on orders
  for select using (auth.role() = 'authenticated');
create policy "orders_insert" on orders
  for insert with check (auth.role() = 'authenticated');
create policy "orders_update" on orders
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "orders_delete_admin_only" on orders
  for delete using (public.is_admin());

create policy "order_items_rw" on order_items
  for select using (auth.role() = 'authenticated');
create policy "order_items_insert" on order_items
  for insert with check (auth.role() = 'authenticated');
create policy "order_items_update" on order_items
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "order_items_delete_admin_only" on order_items
  for delete using (public.is_admin());

create policy "quick_requests_rw" on quick_requests
  for select using (auth.role() = 'authenticated');
create policy "quick_requests_insert" on quick_requests
  for insert with check (auth.role() = 'authenticated');
create policy "quick_requests_update" on quick_requests
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "quick_requests_delete_admin_only" on quick_requests
  for delete using (public.is_admin());
