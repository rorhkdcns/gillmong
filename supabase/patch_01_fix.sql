-- ============================================================
-- 길몽상점 Patch 01 — Supabase SQL Editor에서 실행
-- ============================================================

-- 1. grade 체크 제약에 'E' 추가
ALTER TABLE public.dreams DROP CONSTRAINT IF EXISTS dreams_grade_check;
ALTER TABLE public.dreams
  ADD CONSTRAINT dreams_grade_check CHECK (grade IN ('A', 'B', 'C', 'D', 'E', 'F'));

-- 2. dreams.user_id FK를 auth.users로 변경 (profiles 없는 사용자도 등록 가능하게)
ALTER TABLE public.dreams DROP CONSTRAINT IF EXISTS dreams_user_id_fkey;
ALTER TABLE public.dreams
  ADD CONSTRAINT dreams_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. profiles INSERT 정책 추가 (트리거 미실행 사용자가 직접 생성 가능하게)
DROP POLICY IF EXISTS "profiles: 본인 삽입" ON public.profiles;
CREATE POLICY "profiles: 본인 삽입"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
