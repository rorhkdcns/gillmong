-- profiles에 is_admin 컬럼 추가
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- 관리자 계정 설정 (아이디가 yoopromise인 계정)
UPDATE public.profiles SET is_admin = true WHERE username = 'yoopromise';

-- notices 테이블
CREATE TABLE IF NOT EXISTS public.notices (
  id         bigserial PRIMARY KEY,
  title      text NOT NULL,
  content    text NOT NULL,
  is_pinned  boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notices_read"  ON public.notices;
DROP POLICY IF EXISTS "notices_admin" ON public.notices;

CREATE POLICY "notices_read" ON public.notices
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "notices_admin" ON public.notices
  FOR ALL TO authenticated
  USING  ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- inquiries 테이블
CREATE TABLE IF NOT EXISTS public.inquiries (
  id          bigserial PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       text NOT NULL,
  content     text NOT NULL,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'answered')),
  answer      text,
  answered_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inquiries_own"   ON public.inquiries;
DROP POLICY IF EXISTS "inquiries_admin" ON public.inquiries;

CREATE POLICY "inquiries_own" ON public.inquiries
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "inquiries_admin" ON public.inquiries
  FOR ALL TO authenticated
  USING  ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));
