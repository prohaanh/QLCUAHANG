-- Keep order totals synchronized with line items and prevent paid/cancelled orders
-- from being reopened through direct API updates.

create or replace function public.recalculate_order_total(p_order_id uuid)
returns void
language plpgsql
set search_path = public
as $$
begin
  update public.orders
  set total = coalesce(
    (select sum(quantity * unit_price) from public.order_items where order_id = p_order_id),
    0
  )
  where id = p_order_id;
end;
$$;

create or replace function public.adjust_order_total_from_items()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.orders
    set total = coalesce(total, 0) + (new.quantity * new.unit_price)
    where id = new.order_id;
    return new;
  end if;

  if tg_op = 'DELETE' then
    update public.orders
    set total = coalesce(total, 0) - (old.quantity * old.unit_price)
    where id = old.order_id;
    return old;
  end if;

  if old.order_id is distinct from new.order_id then
    update public.orders
    set total = coalesce(total, 0) - (old.quantity * old.unit_price)
    where id = old.order_id;
    update public.orders
    set total = coalesce(total, 0) + (new.quantity * new.unit_price)
    where id = new.order_id;
  else
    update public.orders
    set total = coalesce(total, 0)
      + (new.quantity * new.unit_price)
      - (old.quantity * old.unit_price)
    where id = new.order_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_order_total_from_items on public.order_items;
create trigger trg_sync_order_total_from_items
  after insert or update or delete on public.order_items
  for each row execute function public.adjust_order_total_from_items();

update public.orders o
set total = coalesce(
  (select sum(oi.quantity * oi.unit_price) from public.order_items oi where oi.order_id = o.id),
  0
);

create or replace function public.prevent_order_status_reversal()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status in ('da_thanh_toan', 'huy') and new.status is distinct from old.status then
    raise exception 'Đơn đã thanh toán hoặc đã hủy không thể mở lại';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_order_status_reversal on public.orders;
create trigger trg_prevent_order_status_reversal
  before update of status on public.orders
  for each row execute function public.prevent_order_status_reversal();

create or replace function public.guard_order_item_lifecycle()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  parent_status text;
begin
  if tg_op = 'DELETE' then
    select status into parent_status from public.orders where id = old.order_id;
    if parent_status is distinct from 'mo' then
      raise exception 'Chỉ được xóa mặt hàng khi đơn còn mở';
    end if;
    return old;
  end if;

  select status into parent_status from public.orders where id = new.order_id;

  if tg_op = 'INSERT' then
    if parent_status is distinct from 'mo' then
      raise exception 'Chỉ được thêm mặt hàng khi đơn còn mở';
    end if;
    return new;
  end if;

  if old.order_id is distinct from new.order_id then
    raise exception 'Không thể chuyển mặt hàng sang đơn khác';
  end if;

  if parent_status = 'mo' then
    return new;
  end if;

  if parent_status is distinct from 'da_thanh_toan' then
    raise exception 'Không thể sửa mặt hàng của đơn đã hủy';
  end if;

  if row(new.item_type, new.product_id, new.service_id, new.license_id, new.quantity, new.unit_price)
     is distinct from
     row(old.item_type, old.product_id, old.service_id, old.license_id, old.quantity, old.unit_price) then
    raise exception 'Không thể sửa nội dung mặt hàng sau khi thanh toán';
  end if;

  if new.fulfillment_status is distinct from old.fulfillment_status then
    if old.fulfillment_status = 'da_giao' or new.fulfillment_status is distinct from 'da_giao' then
      raise exception 'Sau thanh toán chỉ được chuyển mặt hàng sang đã giao';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_order_item_lifecycle on public.order_items;
create trigger trg_guard_order_item_lifecycle
  before insert or update or delete on public.order_items
  for each row execute function public.guard_order_item_lifecycle();