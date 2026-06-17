-- ── banners 테이블 ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.banners (
  id         bigserial PRIMARY KEY,
  image_url  text        NOT NULL,
  link_url   text        NOT NULL DEFAULT '/',
  "order"    integer     NOT NULL DEFAULT 0,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "banners_read"  ON public.banners;
DROP POLICY IF EXISTS "banners_admin" ON public.banners;

-- 누구나 읽기 가능
CREATE POLICY "banners_read" ON public.banners
  FOR SELECT TO anon, authenticated USING (true);

-- 관리자만 CUD 가능
CREATE POLICY "banners_admin" ON public.banners
  FOR ALL TO authenticated
  USING  ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- ── Supabase Storage 버킷 설정 안내 ──────────────────────────
-- Supabase 대시보드 > Storage > New Bucket 에서 수동 생성 필요:
--   버킷 이름: banners
--   Public bucket: ON (체크)
--
-- 버킷 생성 후 아래 Storage Policy 추가 (Storage > Policies):
--   대상 버킷: banners
--   Policy 이름: banners_public_read
--   허용 작업: SELECT
--   대상 역할: public (anon 포함)
--
--   Policy 이름: banners_admin_upload
--   허용 작업: INSERT, UPDATE, DELETE
--   대상 역할: authenticated
--   조건: (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
