-- dreams 테이블에 is_public 컬럼 추가
-- true = 마켓 공개, false = 개인 저장
alter table public.dreams add column if not exists is_public boolean not null default true;

-- 개인 저장 꿈은 price 0 허용 (판매가 불필요)
alter table public.dreams drop constraint if exists dreams_price_check;
alter table public.dreams add constraint dreams_price_check check (price >= 0);
