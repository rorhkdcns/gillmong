-- ============================================================
-- 길몽상점 migration 20260806: 쿠팡파트너스 연동용 컬럼 추가
-- Supabase 대시보드 → SQL Editor 에서 실행
-- ============================================================

alter table public.affiliate_products
  add column if not exists coupang_product_id text;

create index if not exists idx_affiliate_coupang_product_id
  on public.affiliate_products(coupang_product_id);
