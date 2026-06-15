-- ============================================================
-- 길몽상점 Supabase Schema
-- Supabase 대시보드 → SQL Editor → New Query 에 붙여넣고 실행
-- ============================================================


-- ──────────────────────────────────────────
-- 1. profiles (회원 추가 정보)
-- ──────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text unique not null,
  nickname   text not null,
  points     integer not null default 0,
  created_at timestamptz not null default now()
);

-- 회원가입 시 profiles 자동 생성 트리거
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, nickname)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ──────────────────────────────────────────
-- 2. dreams (꿈 등록)
-- ──────────────────────────────────────────
create table if not exists public.dreams (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  content       text not null,          -- 원문 (구매자에게만 공개)
  summary       text not null,          -- 요약 (모두에게 공개)
  grade         text not null check (grade in ('A','B','C','D','F')),
  category      text not null,          -- people / animals / nature / action / etc
  price         integer not null check (price > 0),
  lucky_numbers integer[] not null default '{}',
  is_sold       boolean not null default false,
  created_at    timestamptz not null default now()
);


-- ──────────────────────────────────────────
-- 3. purchases (구매 내역)
-- ──────────────────────────────────────────
create table if not exists public.purchases (
  id         bigint generated always as identity primary key,
  buyer_id   uuid not null references public.profiles(id) on delete cascade,
  dream_id   bigint not null references public.dreams(id) on delete cascade,
  price      integer not null,
  created_at timestamptz not null default now(),
  unique (buyer_id, dream_id)           -- 동일 꿈 중복 구매 방지
);


-- ──────────────────────────────────────────
-- 4. point_logs (포인트 내역)
-- ──────────────────────────────────────────
create table if not exists public.point_logs (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  amount      integer not null,         -- 양수=충전·수익, 음수=사용
  type        text not null check (type in ('charge','use','earn')),
  description text not null default '',
  created_at  timestamptz not null default now()
);


-- ============================================================
-- RLS (Row Level Security) 설정
-- ============================================================

-- profiles ──────────────────────────────
alter table public.profiles enable row level security;

create policy "profiles: 본인만 조회"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: 본인만 수정"
  on public.profiles for update
  using (auth.uid() = id);


-- dreams ────────────────────────────────
alter table public.dreams enable row level security;

create policy "dreams: 전체 목록 조회 허용"
  on public.dreams for select
  using (true);

create policy "dreams: 본인만 등록"
  on public.dreams for insert
  with check (auth.uid() = user_id);

create policy "dreams: 본인만 수정"
  on public.dreams for update
  using (auth.uid() = user_id);

create policy "dreams: 본인만 삭제"
  on public.dreams for delete
  using (auth.uid() = user_id);


-- purchases ─────────────────────────────
alter table public.purchases enable row level security;

create policy "purchases: 본인 구매 내역만 조회"
  on public.purchases for select
  using (auth.uid() = buyer_id);

create policy "purchases: 본인만 구매"
  on public.purchases for insert
  with check (auth.uid() = buyer_id);


-- point_logs ────────────────────────────
alter table public.point_logs enable row level security;

create policy "point_logs: 본인 내역만 조회"
  on public.point_logs for select
  using (auth.uid() = user_id);

create policy "point_logs: 본인만 추가"
  on public.point_logs for insert
  with check (auth.uid() = user_id);


-- ============================================================
-- 인덱스 (조회 성능)
-- ============================================================
create index if not exists idx_dreams_user_id   on public.dreams(user_id);
create index if not exists idx_dreams_category  on public.dreams(category);
create index if not exists idx_dreams_grade     on public.dreams(grade);
create index if not exists idx_purchases_buyer  on public.purchases(buyer_id);
create index if not exists idx_point_logs_user  on public.point_logs(user_id);
