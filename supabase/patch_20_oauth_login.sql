-- patch_20: 카카오/네이버 소셜 로그인 대응 — 프로필 자동 생성 트리거 보강
--
-- 배경: 기존 handle_new_user()는 아이디/비번 회원가입(raw_user_meta_data에
-- username/nickname/email이 항상 채워짐)만 가정하고 있었음. 소셜 로그인은
-- 이 값들이 없을 수 있고, 이메일 로컬파트로 만든 username이 기존 회원과
-- 충돌할 수 있어 보강함. member_type은 기존과 동일하게 메타데이터에 없으면
-- 'general'(일반회원)로 저장되므로 이 부분은 변경 없음.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_member_type text;
  v_username    text;
  v_nickname    text;
  v_email       text;
begin
  v_member_type := coalesce(new.raw_user_meta_data->>'member_type', 'general');

  v_username := coalesce(
    nullif(new.raw_user_meta_data->>'username', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'user_' || replace(new.id::text, '-', '')
  );

  v_nickname := coalesce(
    nullif(new.raw_user_meta_data->>'nickname', ''),
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'name', ''),
    nullif(new.raw_user_meta_data->>'preferred_username', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'user_' || substr(replace(new.id::text, '-', ''), 1, 8)
  );

  v_email := coalesce(
    nullif(new.raw_user_meta_data->>'email', ''),
    new.email,
    ''
  );

  begin
    insert into public.profiles (
      id, username, nickname, real_name, phone, email,
      member_type, business_name, business_number, representative_name,
      verification_status
    )
    values (
      new.id, v_username, v_nickname,
      coalesce(new.raw_user_meta_data->>'real_name', ''),
      coalesce(new.raw_user_meta_data->>'phone', ''),
      v_email,
      v_member_type,
      new.raw_user_meta_data->>'business_name',
      new.raw_user_meta_data->>'business_number',
      new.raw_user_meta_data->>'representative_name',
      case when v_member_type = 'business' then 'pending' else null end
    );
  exception when unique_violation then
    -- username 충돌(주로 소셜 로그인의 이메일 로컬파트가 기존 아이디와 겹치는 경우) 시
    -- 고유 접미사를 붙여 재시도
    insert into public.profiles (
      id, username, nickname, real_name, phone, email,
      member_type, business_name, business_number, representative_name,
      verification_status
    )
    values (
      new.id, v_username || '_' || substr(replace(new.id::text, '-', ''), 1, 6), v_nickname,
      coalesce(new.raw_user_meta_data->>'real_name', ''),
      coalesce(new.raw_user_meta_data->>'phone', ''),
      v_email,
      v_member_type,
      new.raw_user_meta_data->>'business_name',
      new.raw_user_meta_data->>'business_number',
      new.raw_user_meta_data->>'representative_name',
      case when v_member_type = 'business' then 'pending' else null end
    );
  end;

  return new;
end;
$$;
