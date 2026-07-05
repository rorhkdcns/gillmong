-- ============================================================
-- 길몽상점 patch_18: 카테고리 관리 기능 (DB 기반 카테고리)
-- Supabase 대시보드 → SQL Editor 에서 실행
-- ============================================================

-- 1. categories 테이블 생성
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  description text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists idx_categories_sort_order on public.categories(sort_order);

alter table public.categories enable row level security;

drop policy if exists "categories_read"  on public.categories;
drop policy if exists "categories_admin" on public.categories;

-- 누구나 읽기 가능
create policy "categories_read" on public.categories
  for select to anon, authenticated using (true);

-- 관리자만 생성/수정/삭제 가능 (기존 banners/notice 등과 동일한 is_admin 체크 방식)
create policy "categories_admin" on public.categories
  for all to authenticated
  using  ((select is_admin from public.profiles where id = auth.uid()))
  with check ((select is_admin from public.profiles where id = auth.uid()));

-- 2. 기존 5개 카테고리 초기 데이터
-- (slug은 dreams.category 기존 텍스트 값과 동일하게 맞춰서 백필이 정확히 매칭되도록 함)
-- (description은 기존 /category/* 5개 페이지에 하드코딩되어 있던 문구를 그대로 이관 — 스키마 요청에는 없었지만
--  페이지 디자인/문구를 그대로 유지하기 위해 추가한 컬럼)
insert into public.categories (name, slug, description, sort_order, is_active)
values
  ('인물·신체', 'people',  '사람, 몸, 표정에 관한 꿈들을 탐색해보세요',             1, true),
  ('동물·식물', 'animals', '동물, 식물, 자연 생명체가 등장하는 꿈들을 탐색해보세요', 2, true),
  ('자연·사물', 'nature',  '자연 현상과 사물이 등장하는 꿈들을 탐색해보세요',       3, true),
  ('행동·상황', 'action',  '특별한 행동이나 상황이 펼쳐지는 꿈들을 탐색해보세요',   4, true),
  ('기타',      'etc',     '분류하기 어려운 독특하고 신비로운 꿈들을 탐색해보세요', 5, true)
on conflict (slug) do nothing;

-- 3. dreams 테이블에 category_id 컬럼 추가 (기존 category 텍스트 컬럼은 안전하게 유지)
alter table public.dreams
  add column if not exists category_id uuid references public.categories(id);

create index if not exists idx_dreams_category_id on public.dreams(category_id);

-- 4. 기존 dreams.category(text) 값을 slug와 매칭해 category_id 백필
update public.dreams d
set category_id = c.id
from public.categories c
where d.category_id is null
  and d.category = c.slug;
