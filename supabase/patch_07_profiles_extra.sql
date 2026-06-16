-- profiles 테이블에 추가 정보 컬럼 추가
alter table public.profiles add column if not exists real_name text not null default '';
alter table public.profiles add column if not exists phone     text not null default '';
alter table public.profiles add column if not exists email     text not null default '';

-- 회원가입 트리거 함수 업데이트 (새 컬럼 포함)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, nickname, real_name, phone, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'real_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'email', '')
  );
  return new;
end;
$$;
