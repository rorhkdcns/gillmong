-- ============================================================
-- 길몽상점 migration 20260803: 해몽 사전 + 제휴상품
-- Supabase 대시보드 → SQL Editor 에서 실행
-- ============================================================

create table if not exists dictionary_entries (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  keyword       text not null,
  summary       text not null,
  body          text not null,
  category_slug text,
  tags          text[] default '{}',
  view_count    int default 0,
  is_published  boolean not null default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists idx_dict_slug on dictionary_entries(slug);
create index if not exists idx_dict_published on dictionary_entries(is_published);

alter table dictionary_entries enable row level security;
create policy "dict_public_read" on dictionary_entries
  for select using (is_published = true);

create table if not exists affiliate_products (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  price_text   text,
  image_url    text,
  link_url     text not null,
  tags         text[] default '{}',
  sort_order   int default 0,
  is_active    boolean not null default true,
  click_count  int default 0,
  created_at   timestamptz default now()
);
create index if not exists idx_affiliate_active on affiliate_products(is_active);

alter table affiliate_products enable row level security;
create policy "affiliate_public_read" on affiliate_products
  for select using (is_active = true);
