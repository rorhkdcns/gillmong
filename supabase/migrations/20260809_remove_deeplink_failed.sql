-- ============================================================
-- 길몽상점 migration 20260809: deeplink_failed 컬럼 제거
-- Supabase 대시보드 → SQL Editor 에서 실행
-- ============================================================
--
-- deeplink_failed=true로 표시된 상품들은 저장 시 딥링크 변환 API를 불필요하게
-- 다시 태워서 생긴 오탐이었다 — link_url(=쿠팡 상품검색 API가 이미 내려준 파트너스
-- 추적 링크)은 실제로 정상 동작한다(2026-08-07 실제 리다이렉트로 확인).
-- 저장 로직에서 이제 변환을 아예 시도하지 않으므로 이 컬럼과 "딥링크 재변환" 기능은
-- 더 이상 쓰이지 않는다.

alter table public.affiliate_products
  drop column if exists deeplink_failed;
