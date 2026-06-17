-- 해몽 API 호출 횟수 추적 테이블 (하루 3회 제한용)
CREATE TABLE IF NOT EXISTS public.analysis_logs (
  id         bigserial PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.analysis_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analysis_logs_own" ON public.analysis_logs;

CREATE POLICY "analysis_logs_own" ON public.analysis_logs
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
