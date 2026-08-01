-- ============================================================
-- 길몽상점 migration 20260805: 사전 조회수 증가를 RPC로 (비차단 + 동시성 안전)
-- Supabase 대시보드 → SQL Editor 에서 실행
-- ============================================================

create or replace function increment_dictionary_view(entry_slug text)
returns void language sql security definer
set search_path = public as $$
  update dictionary_entries
  set view_count = coalesce(view_count, 0) + 1
  where slug = entry_slug;
$$;

grant execute on function increment_dictionary_view(text) to anon, authenticated;
