-- ============================================================
-- 길몽상점 Patch 02 — Supabase SQL Editor에서 실행
-- 관리자용 포인트 지급 RPC 함수
-- ============================================================

-- 기존 함수 삭제 후 재생성 (파라미터 순서 고정)
drop function if exists public.admin_give_points(text, integer);
drop function if exists public.admin_give_points(integer, text);

create or replace function public.admin_give_points(
  target_username text,
  amount_to_add   integer
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id  uuid;
  new_points integer;
begin
  if amount_to_add <= 0 then
    return json_build_object('error', '지급 금액은 1 이상이어야 합니다');
  end if;

  select id into target_id
  from public.profiles
  where username = target_username;

  if target_id is null then
    return json_build_object('error', '존재하지 않는 아이디입니다');
  end if;

  update public.profiles
  set points = points + amount_to_add
  where id = target_id
  returning points into new_points;

  insert into public.point_logs (user_id, amount, type, description)
  values (target_id, amount_to_add, 'charge', '관리자 포인트 지급');

  return json_build_object('success', true, 'new_points', new_points);
end;
$$;

-- 인증된 사용자라면 누구나 호출 가능하게 권한 부여
grant execute on function public.admin_give_points(text, integer) to authenticated;
