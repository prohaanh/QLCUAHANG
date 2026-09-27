-- QLCuaHang — cấp đủ quyền bảng (GRANT) cho role authenticated
-- RLS (policy) vẫn là lớp kiểm soát thật sự — GRANT chỉ là điều kiện cần để RLS được xét tới.
-- Thiếu GRANT thì Postgres chặn ngay ở tầng bảng (lỗi 42501), không kịp chạy tới policy.
-- Chạy 1 lần, an toàn khi chạy lại nhiều lần.

grant usage on schema public to authenticated;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Để các bảng tạo sau này (migration sau) tự động được cấp quyền, không phải nhớ chạy GRANT lại mỗi lần
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;
