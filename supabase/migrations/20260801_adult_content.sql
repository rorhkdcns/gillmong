-- ============================================================
-- 길몽상점 migration 20260801: 성인 콘텐츠(is_adult) 플래그 도입
-- Supabase 대시보드 → SQL Editor 에서 실행
-- ============================================================

-- 1. dreams.is_adult
alter table public.dreams
  add column if not exists is_adult boolean not null default false;

create index if not exists idx_dreams_is_adult on public.dreams(is_adult);


-- 2. adult_verifications (연령 인증 기록 — service_role 전용, RLS만 켜고 정책은 없음)
create table if not exists public.adult_verifications (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  verified_at timestamptz not null default now(),
  method      text not null
);

alter table public.adult_verifications enable row level security;
-- ⚠️ 정책을 의도적으로 만들지 않음. RLS만 켜서 기본적으로 모든 접근을 차단하고,
--    service_role(서버 전용 admin 클라이언트)만 우회해서 읽고 쓸 수 있게 한다.


-- 3. is_adult_user() — 현재 로그인 사용자의 연령 인증 여부를 조회하는 헬퍼 함수
create or replace function public.is_adult_user()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.adult_verifications
    where user_id = auth.uid()
  );
$$;

grant execute on function public.is_adult_user() to anon, authenticated;


-- 4. (미적용) dreams select 정책 — 카카오 연령대 인증 붙인 뒤에 켤 예정
-- create policy "dreams: 성인 콘텐츠는 인증된 사용자만 조회"
--   on public.dreams for select
--   using (is_adult = false or public.is_adult_user());
