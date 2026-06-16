-- grade 제약 조건에 'E' 추가 (흉몽의 기운)
alter table public.dreams
  drop constraint if exists dreams_grade_check;

alter table public.dreams
  add constraint dreams_grade_check
  check (grade in ('A', 'B', 'C', 'D', 'E', 'F'));
