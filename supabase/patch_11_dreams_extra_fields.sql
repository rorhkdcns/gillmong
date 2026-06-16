-- dreams 테이블에 해몽 상세 정보 컬럼 추가
alter table public.dreams
  add column if not exists dream_type     text not null default '중립',
  add column if not exists interpretation text not null default '',
  add column if not exists advice         text not null default '';
