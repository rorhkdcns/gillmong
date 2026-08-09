-- ============================================================
-- 길몽상점 migration 002: 상품관리(/admin/shop-products)용 샵 카테고리 체계
-- Supabase 대시보드 → SQL Editor 에서 실행
-- ============================================================
--
-- ★ 이미 프로덕션 DB에 실제로 적용된 스키마를 리포에 뒤늦게 기록해 남기는
--   파일이다(원본 SQL 파일 자체가 리포에 없어 유실됐던 것을 실제 DB 스키마를
--   역으로 확인해 재구성함, 2026-08-09). 그래서 전부 if not exists로 감싸
--   다시 실행해도 안전하게 no-op이 되도록 함.
--
-- 기존 categories 테이블(domain='dream'/'shop')과는 별개의 독립된 테이블이다
-- — /admin/shop-products 화면 전용으로 단순한 대분류/소분류 체계만 필요해서
--   분리했고, 상품 데이터 자체는 기존 affiliate_products 테이블을 그대로
--   공유해서 쓴다(shop_category_id/shop_subcategory_id 컬럼만 추가).

create table if not exists public.shop_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text unique not null,
  sort_order int not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.shop_subcategories (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.shop_categories(id) on delete cascade,
  name        text not null,
  slug        text not null,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (category_id, slug)
);

create index if not exists idx_shop_subcategories_category_id
  on public.shop_subcategories(category_id);

alter table public.shop_categories enable row level security;
create policy "shop_categories_public_read" on public.shop_categories
  for select using (is_active = true);

alter table public.shop_subcategories enable row level security;
create policy "shop_subcategories_public_read" on public.shop_subcategories
  for select using (is_active = true);

-- affiliate_products가 샵 카테고리를 선택적으로 참조 — 카테고리/하위카테고리가
-- 삭제되면 상품은 지우지 않고 미분류(null)로만 되돌린다.
alter table public.affiliate_products
  add column if not exists shop_category_id uuid references public.shop_categories(id) on delete set null;

alter table public.affiliate_products
  add column if not exists shop_subcategory_id uuid references public.shop_subcategories(id) on delete set null;

create index if not exists idx_affiliate_shop_category_id
  on public.affiliate_products(shop_category_id);

create index if not exists idx_affiliate_shop_subcategory_id
  on public.affiliate_products(shop_subcategory_id);
