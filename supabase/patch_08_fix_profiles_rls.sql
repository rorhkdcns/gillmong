-- profiles SELECT 정책을 공개 읽기로 변경
-- (카테고리/상세 페이지에서 판매자 닉네임 표시에 필요)
drop policy if exists "profiles: 본인만 조회" on public.profiles;
create policy "profiles: 전체 조회 허용" on public.profiles for select using (true);
