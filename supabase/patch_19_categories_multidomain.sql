-- ============================================================
-- 길몽상점 patch_19: categories 테이블 멀티 도메인 확장
-- (꿈 거래 + 쇼핑몰/제휴사 카테고리를 하나의 테이블에서 관리)
-- Supabase 대시보드 → SQL Editor 에서 실행
-- ============================================================

-- 1. 신규 컬럼 추가 (기존 데이터 보존, default로 안전하게)
alter table public.categories
  add column if not exists domain     text not null default 'dream',
  add column if not exists parent_id  uuid references public.categories(id),
  add column if not exists image_url  text;

-- domain 허용값 체크 제약
alter table public.categories
  drop constraint if exists categories_domain_check;
alter table public.categories
  add constraint categories_domain_check check (domain in ('dream', 'shop', 'affiliate'));

create index if not exists idx_categories_domain on public.categories(domain);
create index if not exists idx_categories_parent_id on public.categories(parent_id);

-- 2. 기존 5개 꿈 카테고리는 domain 컬럼 default('dream')로 자동 채워짐 — 별도 UPDATE 불필요.
--    (실행 후 확인용, 아래 select는 결과 확인만 하고 넘어가면 됨)
select id, name, slug, domain, parent_id, image_url, sort_order, is_active
from public.categories
order by sort_order;

-- 3. 기존 unique 제약 제거 후 domain 기준 복합 unique로 교체
--    ⚠️ name 단독 unique 제약을 그대로 두면 도메인이 달라도 이름이 겹칠 수 없게 되어
--    "쇼핑몰 - 기타" 카테고리를 "꿈 - 기타"와 별개로 만들 수 없음 → 이것도 같이 교체 대상.
alter table public.categories drop constraint if exists categories_name_key;
alter table public.categories drop constraint if exists categories_slug_key;

alter table public.categories
  add constraint categories_domain_slug_key unique (domain, slug);

-- ⚠️ unique (domain, parent_id, name)를 일반 제약(constraint)으로 만들면 실효성이 없음:
--    Postgres UNIQUE는 NULL을 서로 다른 값으로 취급하므로, parent_id가 항상 null인
--    최상위 카테고리(꿈 카테고리 전체, 쇼핑몰 최상위 카테고리)끼리는 이름이 겹쳐도
--    제약을 통과해버림. parent_id가 null/not null인 경우를 분리한
--    partial unique index 두 개로 구현해야 의도한 대로 동작함.
drop index if exists categories_domain_parent_name_key;
create unique index categories_domain_parent_name_key
  on public.categories (domain, name)
  where parent_id is null;
create unique index categories_domain_parent_name_child_key
  on public.categories (domain, parent_id, name)
  where parent_id is not null;

-- 4. RLS 정책 재확인 — 둘 다 domain 조건이 없어 그대로 전체 도메인에 적용됨, 변경 불필요.
--    categories_read  : to anon, authenticated using (true)                     → 전체 도메인 읽기 허용
--    categories_admin : is_admin 체크, using/with check 모두 domain 무관하게 전체 행 대상
--    (참고: 실제 관리자 페이지의 쓰기는 서버 액션의 service-role 클라이언트를 통하므로
--     RLS는 방어선 역할만 하며, is_admin=false인 계정에서도 정상 동작합니다.)
