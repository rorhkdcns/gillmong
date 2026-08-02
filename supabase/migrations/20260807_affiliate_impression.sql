-- ============================================================
-- 길몽상점 migration 20260807: 제휴상품 노출수 집계
-- Supabase 대시보드 → SQL Editor 에서 실행
-- ============================================================

alter table public.affiliate_products
  add column if not exists impression_count int default 0;

create or replace function public.increment_affiliate_impressions(ids uuid[])
returns void
language sql
security definer
set search_path = public
as $$
  update public.affiliate_products
  set impression_count = coalesce(impression_count, 0) + 1
  where id = any(ids);
$$;

grant execute on function public.increment_affiliate_impressions(uuid[]) to anon, authenticated;
