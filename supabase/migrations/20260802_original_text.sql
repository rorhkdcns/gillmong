-- ============================================================
-- 길몽상점 migration 20260802: 원문/AI 재구성 선택 저장
-- Supabase 대시보드 → SQL Editor 에서 실행
-- ============================================================

alter table public.dreams
  add column if not exists original_text text,
  add column if not exists content_mode text default 'ai';

alter table public.saved_dreams
  add column if not exists original_text text,
  add column if not exists content_mode text default 'ai';
