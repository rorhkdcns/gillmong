-- dreams 테이블에 해몽 상세 컬럼 추가
alter table public.dreams add column if not exists type text not null default '중립' check (type in ('길몽', '흉몽', '중립'));
alter table public.dreams add column if not exists interpretation text not null default '';
alter table public.dreams add column if not exists advice text not null default '';
