-- Nhánh 2 — Đăng nhập & phân quyền
-- Chạy trong Supabase SQL Editor SAU schema.sql gốc, TRƯỚC các migration nhánh 3A
alter table users
  add column if not exists email text unique,
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;
-- Cho phép người dùng đọc chính hàng "users" của mình để lấy tên/vai trò sau khi đăng nhập
-- (giữ nguyên policy allow_authenticated_all hiện có cho các bảng khác — chưa siết quyền
-- theo role ở bước này, sẽ làm ở nhánh bảo mật riêng sau khi đăng nhập chạy ổn).
