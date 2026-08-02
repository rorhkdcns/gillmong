-- ============================================================
-- 길몽상점 migration 20260808: 딥링크 변환 실패 상태 추적
-- Supabase 대시보드 → SQL Editor 에서 실행
-- ============================================================

alter table public.affiliate_products
  add column if not exists deeplink_failed boolean not null default false;
