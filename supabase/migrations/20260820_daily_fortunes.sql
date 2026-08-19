-- ============================================================
-- 길몽상점 migration 20260820: 오늘의 운세(띠·별자리) 테이블
-- Supabase 대시보드 → SQL Editor 에서 실행
-- 이미 007_daily_fortunes.sql 로 생성했다면 그대로 no-op.
-- ============================================================

create table if not exists daily_fortunes (
  id uuid primary key default gen_random_uuid(),
  fortune_date date not null,
  type text not null check (type in ('zodiac', 'star')),
  key text not null,
  content text not null,
  created_at timestamptz not null default now(),
  unique (fortune_date, type, key)
);

create index if not exists idx_daily_fortunes_date on daily_fortunes(fortune_date);
