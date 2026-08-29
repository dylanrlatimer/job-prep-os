alter table app.theory_categories
  add column is_active boolean not null default true;

create index theory_categories_active_idx
  on app.theory_categories (is_active)
  where is_active = true;
