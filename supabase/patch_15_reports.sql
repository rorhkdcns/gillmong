CREATE TABLE IF NOT EXISTS public.reports (
  id          bigserial   PRIMARY KEY,
  dream_id    bigint      NOT NULL REFERENCES public.dreams(id) ON DELETE CASCADE,
  reporter_id uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason      text        NOT NULL,
  detail      text,
  status      text        NOT NULL DEFAULT 'pending',
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_insert"   ON public.reports;
DROP POLICY IF EXISTS "reports_own_read" ON public.reports;
DROP POLICY IF EXISTS "reports_admin"    ON public.reports;

-- 로그인 사용자는 신고 제출 가능
CREATE POLICY "reports_insert" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- 자신이 제출한 신고만 조회 가능
CREATE POLICY "reports_own_read" ON public.reports
  FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);

-- 관리자는 전체 CRUD 가능
CREATE POLICY "reports_admin" ON public.reports
  FOR ALL TO authenticated
  USING  ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));
