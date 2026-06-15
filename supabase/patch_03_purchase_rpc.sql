-- ============================================================
-- 길몽상점 Patch 03 — Supabase SQL Editor에서 실행
-- 구매 트랜잭션 RPC (RLS 우회, 원자적 처리)
-- ============================================================

create or replace function public.purchase_dream(
  p_dream_id bigint,
  p_price    integer
)
returns json
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_buyer_id       uuid := auth.uid();
  v_seller_id      uuid;
  v_dream_title    text;
  v_buyer_points   integer;
  v_seller_earning integer;
begin
  -- 꿈 존재 + 미판매 확인
  select user_id, title
  into   v_seller_id, v_dream_title
  from   public.dreams
  where  id = p_dream_id and is_sold = false;

  if not found then
    return json_build_object('error', '이미 판매된 꿈이거나 존재하지 않습니다');
  end if;

  -- 본인 꿈 구매 방지
  if v_buyer_id = v_seller_id then
    return json_build_object('error', '본인의 꿈은 구매할 수 없습니다');
  end if;

  -- 구매자 잔액 확인
  select points into v_buyer_points
  from   public.profiles
  where  id = v_buyer_id;

  if v_buyer_points is null or v_buyer_points < p_price then
    return json_build_object('error', '포인트가 부족합니다');
  end if;

  -- 구매 기록 삽입
  insert into public.purchases (buyer_id, dream_id, price)
  values (v_buyer_id, p_dream_id, p_price);

  -- 구매자 포인트 차감
  update public.profiles
  set    points = points - p_price
  where  id = v_buyer_id;

  -- 구매자 포인트 내역
  insert into public.point_logs (user_id, amount, type, description)
  values (v_buyer_id, -p_price, 'use', '꿈 구매 — ' || v_dream_title);

  -- 꿈 판매완료 처리
  update public.dreams
  set    is_sold = true
  where  id = p_dream_id;

  -- 판매자 수익 (80%)
  v_seller_earning := floor(p_price * 0.8);

  -- 판매자 프로필이 있는 경우에만 포인트 지급 (프로필 없으면 FK 위반으로 전체 롤백 방지)
  if exists (select 1 from public.profiles where id = v_seller_id) then
    update public.profiles
    set    points = points + v_seller_earning
    where  id = v_seller_id;

    insert into public.point_logs (user_id, amount, type, description)
    values (v_seller_id, v_seller_earning, 'earn', '꿈 판매 수익 — ' || v_dream_title);
  end if;

  return json_build_object('success', true);
end;
$$;

grant execute on function public.purchase_dream(bigint, integer) to authenticated;
