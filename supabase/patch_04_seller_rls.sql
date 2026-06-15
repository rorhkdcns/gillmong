-- ============================================================
-- 길몽상점 Patch 04 — Supabase SQL Editor에서 실행
-- 판매자가 자신의 꿈이 구매된 내역을 조회할 수 있도록 RLS 추가
-- ============================================================

-- 기존 구매자 전용 정책은 유지하고, 판매자 조회 정책을 추가
create policy "purchases: 판매자 조회 허용"
  on public.purchases for select
  using (
    auth.uid() = buyer_id
    or auth.uid() = (select user_id from public.dreams where id = dream_id)
  );
