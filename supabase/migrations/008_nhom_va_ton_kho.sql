-- Nhóm sản phẩm/dịch vụ (dùng chung cho products và services)
create table product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table products add column category_id uuid references product_categories(id);
alter table services add column category_id uuid references product_categories(id);

-- Trạng thái giao hàng của từng dòng trong đơn — độc lập với trạng thái thanh toán
alter table order_items add column fulfillment_status text not null default 'du_hang'
  check (fulfillment_status in ('du_hang', 'dat_truoc', 'da_giao'));

-- Lịch sử nhập/xuất kho (chỉ áp dụng cho products)
create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  type text not null check (type in ('nhap', 'xuat', 'dieu_chinh')),
  quantity int not null, -- nhap/xuat: luôn dương; dieu_chinh: có thể âm hoặc dương
  order_id uuid references orders(id),
  note text,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

-- Trigger: mỗi lần thêm movement thì tự cập nhật products.stock_qty, chặn không cho âm
create or replace function apply_inventory_movement()
returns trigger as $$
declare
  delta int;
  new_stock int;
begin
  delta := case
    when new.type = 'nhap' then new.quantity
    when new.type = 'xuat' then -new.quantity
    when new.type = 'dieu_chinh' then new.quantity
    else 0
  end;

  select stock_qty + delta into new_stock from products where id = new.product_id;

  if new_stock < 0 then
    raise exception 'Kho không đủ hàng: tồn kho sẽ âm (%), không cho phép', new_stock;
  end if;

  update products set stock_qty = new_stock where id = new.product_id;
  return new;
end;
$$ language plpgsql;

create trigger trg_apply_inventory_movement
  before insert on inventory_movements
  for each row execute function apply_inventory_movement();

-- Trigger: khi đơn hàng chuyển sang da_thanh_toan, tự trừ kho theo order_items đang du_hang
create or replace function auto_deduct_stock_on_paid()
returns trigger as $$
begin
  if new.status = 'da_thanh_toan' and old.status is distinct from 'da_thanh_toan' then
    insert into inventory_movements (product_id, type, quantity, order_id, note, created_by)
    select oi.product_id, 'xuat', oi.quantity, new.id, 'Tự động trừ kho khi thanh toán đơn', new.created_by
    from order_items oi
    where oi.order_id = new.id
      and oi.item_type = 'product'
      and oi.fulfillment_status = 'du_hang';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_auto_deduct_stock
  after update of status on orders
  for each row execute function auto_deduct_stock_on_paid();

-- Trigger: khi order_items chuyển từ dat_truoc sang da_giao (hàng về, giao cho khách), tự trừ kho lúc đó
create or replace function auto_deduct_stock_on_fulfilled()
returns trigger as $$
begin
  if new.fulfillment_status = 'da_giao' and old.fulfillment_status = 'dat_truoc' and new.item_type = 'product' then
    insert into inventory_movements (product_id, type, quantity, order_id, note)
    values (new.product_id, 'xuat', new.quantity, new.order_id, 'Trừ kho khi giao hàng đặt trước');
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_auto_deduct_stock_fulfilled
  after update of fulfillment_status on order_items
  for each row execute function auto_deduct_stock_on_fulfilled();

alter table product_categories enable row level security;
alter table inventory_movements enable row level security;

create policy allow_authenticated_all on product_categories for all to authenticated using (true) with check (true);
create policy allow_authenticated_all on inventory_movements for all to authenticated using (true) with check (true);
