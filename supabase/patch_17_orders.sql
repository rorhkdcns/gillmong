-- ============================================================
-- 길몽상점 patch_17: 에스크로 주문 테이블 (크몽식 결제)
-- Supabase 대시보드 → SQL Editor 에서 실행
-- ============================================================

create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  buyer_id         uuid not null references auth.users(id),
  seller_id        uuid not null references auth.users(id),
  dream_id         bigint not null references public.dreams(id),
  amount           integer not null,
  seller_amount    integer not null,
  payment_method   text not null,
  nicepay_tid      text,
  nicepay_order_id text,
  status           text not null default 'pending'
    check (status in ('pending','paid_escrow','confirmed','settled','disputed','refunded')),
  paid_at          timestamptz not null default now(),
  confirm_deadline timestamptz,
  confirmed_at     timestamptz,
  settled_at       timestamptz,
  dispute_reason   text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_orders_buyer   on public.orders(buyer_id);
create index if not exists idx_orders_seller  on public.orders(seller_id);
create index if not exists idx_orders_status  on public.orders(status);
create index if not exists idx_orders_deadline on public.orders(confirm_deadline) where status = 'paid_escrow';

alter table public.orders enable row level security;

-- 구매자/판매자 본인 주문 조회
create policy "orders: 구매자 조회"
  on public.orders for select
  using (auth.uid() = buyer_id);

create policy "orders: 판매자 조회"
  on public.orders for select
  using (auth.uid() = seller_id);

-- insert/update 는 service_role(admin client)만 허용 (RLS 정책 없으면 차단됨)
