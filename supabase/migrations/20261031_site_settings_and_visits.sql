-- ============================================================
-- 길몽상점 migration 20261031: 사이트 설정(푸터 정보) + 방문 유입 기록
-- Supabase 대시보드 → SQL Editor 에서 한 번 실행하세요. (여러 번 실행해도 안전)
-- ============================================================

create table if not exists site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table site_settings enable row level security;  -- 정책 없음 = 서버(service role)만 접근

create table if not exists site_visits (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  landing_path text not null,
  source text not null,          -- 네이버 / 구글 / 다음 / 인스타그램 … / 직접 유입
  medium text,                   -- 검색 / SNS / 광고 / 기타 / 직접
  keyword text,                  -- 검색어(알 수 있는 경우만) 또는 utm_term
  referrer_host text,
  campaign text                  -- utm_campaign
);
alter table site_visits enable row level security;
create index if not exists idx_site_visits_created on site_visits(created_at desc);
