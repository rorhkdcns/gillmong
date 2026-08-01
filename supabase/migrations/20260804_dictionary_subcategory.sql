-- ============================================================
-- 길몽상점 migration 20260804: 해몽 사전 2단계 카테고리(소분류) 도입
-- Supabase 대시보드 → SQL Editor 에서 실행
-- ============================================================

create table if not exists dictionary_subcategories (
  slug            text primary key,
  name            text not null,
  parent_slug     text not null,
  description     text,
  sort_order      int default 0,
  has_public_page boolean not null default true,
  is_active       boolean not null default true
);

alter table dictionary_subcategories enable row level security;
create policy "subcat_public_read" on dictionary_subcategories
  for select using (is_active = true);

alter table dictionary_entries
  add column if not exists subcategory_slug text;
create index if not exists idx_dict_subcat
  on dictionary_entries(subcategory_slug);


-- ── 초기 데이터 ──────────────────────────────────────────────
-- parent_slug는 기존 categories 테이블의 slug(people/animals/nature/action/etc)를 그대로 사용.
-- '기타' 소분류(*-etc)는 sort_order 999 + has_public_page=false — 분류용으로만 쓰고 자체 페이지는 만들지 않음.
-- 대분류 etc 아래에는 소분류를 만들지 않음.

insert into dictionary_subcategories (slug, name, parent_slug, sort_order, has_public_page) values
  -- people (인물·신체)
  ('family',      '가족·친척',        'people', 10,  true),
  ('ancestors',   '죽은 사람·조상',    'people', 20,  true),
  ('romance',     '연인·이성',        'people', 30,  true),
  ('pregnancy',   '임신·출산(태몽)',   'people', 40,  true),
  ('baby',        '아기·아이',        'people', 50,  true),
  ('celebrity',   '연예인·유명인',     'people', 60,  true),
  ('stranger',    '낯선 사람·군중',    'people', 70,  true),
  ('body',        '신체·머리카락',     'people', 80,  true),
  ('people-etc',  '기타 인물',        'people', 999, false),

  -- animals (동물·식물)
  ('snake',       '뱀·파충류',        'animals', 10,  true),
  ('dragon',      '용·상상동물',       'animals', 20,  true),
  ('livestock',   '돼지·가축',        'animals', 30,  true),
  ('beast',       '호랑이·맹수',       'animals', 40,  true),
  ('pets',        '개·고양이',        'animals', 50,  true),
  ('birds',       '새·조류',          'animals', 60,  true),
  ('fish',        '물고기·수생',       'animals', 70,  true),
  ('insects',     '곤충·벌레',        'animals', 80,  true),
  ('plants',      '나무·꽃·열매',      'animals', 90,  true),
  ('animals-etc', '기타 동식물',       'animals', 999, false),

  -- nature (자연·사물)
  ('water',       '물·바다·강',        'nature', 10,  true),
  ('fire',        '불·연기',          'nature', 20,  true),
  ('sky',         '하늘·해·달·별',     'nature', 30,  true),
  ('land',        '산·땅·집',         'nature', 40,  true),
  ('money',       '돈·금·보석',        'nature', 50,  true),
  ('food',        '음식·똥',          'nature', 60,  true),
  ('clothes',     '옷·신발·장신구',     'nature', 70,  true),
  ('vehicle',     '차·탈것',          'nature', 80,  true),
  ('nature-etc',  '기타 자연·사물',     'nature', 999, false),

  -- action (행동·상황)
  ('chase',       '쫓기다·도망',       'action', 10,  true),
  ('falling',     '떨어지다·추락',      'action', 20,  true),
  ('flying',      '날다',            'action', 30,  true),
  ('death',       '죽음·장례',        'action', 40,  true),
  ('fight',       '싸움·다툼',        'action', 50,  true),
  ('illness',     '병·다침',          'action', 60,  true),
  ('wedding',     '결혼·잔치',        'action', 70,  true),
  ('work',        '시험·직장',        'action', 80,  true),
  ('action-etc',  '기타 상황',        'action', 999, false)
on conflict (slug) do nothing;
