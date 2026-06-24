-- patch_16: 회원 구분 기능 추가 (일반회원 / 사업자회원)

-- 1. profiles 테이블 컬럼 추가
alter table public.profiles
  add column if not exists member_type         text not null default 'general',
  add column if not exists business_name       text,
  add column if not exists business_number     text,
  add column if not exists representative_name text,
  add column if not exists verified_at         timestamptz,
  add column if not exists verification_status text;

-- 2. 기존 회원 모두 일반회원으로 설정
update public.profiles
set member_type = 'general'
where member_type is null or member_type = '';

-- 3. 회원가입 트리거 함수 업데이트 (신규 컬럼 포함)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_member_type text;
begin
  v_member_type := coalesce(new.raw_user_meta_data->>'member_type', 'general');

  insert into public.profiles (
    id, username, nickname, real_name, phone, email,
    member_type, business_name, business_number, representative_name,
    verification_status
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'real_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'email', ''),
    v_member_type,
    new.raw_user_meta_data->>'business_name',
    new.raw_user_meta_data->>'business_number',
    new.raw_user_meta_data->>'representative_name',
    case when v_member_type = 'business' then 'pending' else null end
  );
  return new;
end;
$$;
