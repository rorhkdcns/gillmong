-- ============================================================
-- 길몽상점 migration 20260806: 제휴상품 품절/단종 헬스체크용 컬럼
-- Supabase 대시보드 → SQL Editor 에서 실행
-- ============================================================

alter table affiliate_products
  add column if not exists product_id text,
  add column if not exists last_checked_at timestamptz,
  add column if not exists deactivated_reason text,
  add column if not exists deactivated_at timestamptz;

create index if not exists idx_affiliate_checked
  on affiliate_products(last_checked_at);
