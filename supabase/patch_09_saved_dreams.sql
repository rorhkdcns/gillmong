-- 개인 저장 꿈 테이블 (마켓 비공개)
create table if not exists public.saved_dreams (
  id            bigserial primary key,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  title         text not null default '',
  content       text not null default '',
  summary       text not null default '',
  grade         text not null default 'C',
  type          text not null default '중립',
  interpretation text not null default '',
  advice        text not null default '',
  lucky_numbers integer[] not null default '{}',
  created_at    timestamptz not null default now()
);

alter table public.saved_dreams enable row level security;

create policy "saved_dreams_own" on public.saved_dreams
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
