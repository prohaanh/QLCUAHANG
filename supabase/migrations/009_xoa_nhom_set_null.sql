alter table products drop constraint products_category_id_fkey;
alter table products add constraint products_category_id_fkey
  foreign key (category_id) references product_categories(id) on delete set null;

alter table services drop constraint services_category_id_fkey;
alter table services add constraint services_category_id_fkey
  foreign key (category_id) references product_categories(id) on delete set null;
