---
name: 길몽상점
description: AI가 해석한 꿈을 사고파는 P2P 마켓플레이스 — 흰 바탕에 코랄 포인트, 각진 모서리, 꿈 등급 5색으로 보여주는 "20대를 위한 꿈 거래소" (H안)
colors:
  brand-page: "#FAF6F2"
  brand-surface: "#FFFFFF"
  brand-primary: "#E5421F"
  brand-primary-hover: "#C23A18"
  brand-primary-light: "#FFF1EA"
  brand-primary-border: "#FFD3C4"
  brand-ink: "#231C17"
  brand-ink-soft: "#6B605A"
  brand-line: "#EADFD8"
  brand-gold: "#FFD23F"
  grade-a: "#231C17 / #FFE14D"
  grade-b: "#D3F0DE / #0B6A36"
  grade-c: "#D6E6FF / #1B4DB3"
  grade-d: "#FFE9A8 / #7A4B00"
  grade-e: "#FFDDE2 / #9E1530"
typography:
  body:
    fontFamily: "Noto Sans KR Variable, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  display-number:
    fontFamily: "Bricolage Grotesque Variable (font-display) — 숫자·등급 알파벳 전용"
    fontWeight: 800
rounded:
  tag: "2px"
  button: "3px"
  card: "4px"
---

# Design System: 길몽상점 (H안 — 화이트 + 코랄)

> 이 문서는 2026-10 리디자인(H안)을 기준으로 다시 쓰였다. 시안 원본은 `design-ref/` 폴더(있다면)와 README의 토큰 표를 따른다.

## 핵심 원칙
- **흰 바탕 + 코랄 한 가지 포인트.** 보라색·파란색 계열은 쓰지 않는다. 눌러야 하는 곳(버튼·링크·활성 메뉴)만 코랄(`brand-primary`), 나머지는 흰색·크림·따뜻한 검정.
- **각진 모서리.** 카드 4px, 버튼 3px, 태그 2px. `rounded-xl` 등 기존 클래스는 globals.css의 `--radius-*`가 자동으로 4px 이하로 만든다. 완전한 알약(`rounded-full`)은 원형 아이콘·뱃지·진행바에만 쓰고, 새 버튼에는 쓰지 않는다.
- **등급은 색으로 구분한다.** A 검정+노랑(홀로그램), B 연초록, C 연파랑, D 연노랑, E 연빨강. 각각 배경보다 진한 글자색. `--color-grade-*` 토큰만 사용하고 화면마다 색을 새로 정하지 않는다.
- **썸네일 안에 카테고리 글자를 넣지 않는다.** 대신 꿈 등급 알파벳을 크게 보여준다.
- **글꼴:** 본문 Noto Sans KR(400/500/700), 숫자·가격·등급 알파벳은 Bricolage Grotesque(`font-display`). 흐릿해 보이지 않도록 `antialiased` + `optimizeLegibility`.
- **움직임:** 화면 진입·카드 hover·홀로그램 정도의 절제된 애니메이션. `prefers-reduced-motion`이면 전부 끈다.
- **CI 로고(남색 정사각형, 길몽/상점 두 줄)는 변경하지 않는다.**
- 색은 `bg-brand-*` / `text-brand-*` / `bg-grade-*-bg` 같은 토큰으로 지정하고 원시 hex를 새로 하드코딩하지 않는다.

## Colors
| 토큰 | 값 | 용도 |
|---|---|---|
| `brand-primary` | #E5421F | 버튼·링크·활성 탭·포커스 (hover: #C23A18) |
| `brand-primary-light` | #FFF1EA | 연한 복숭아 배경, 활성 드롭다운 항목 |
| `brand-page` | #FAF6F2 | 페이지·푸터 배경(크림) |
| `brand-ink` | #231C17 | 제목·본문·로고 텍스트 (순검정 금지) |
| `brand-ink-soft` | #6B605A | 보조 텍스트 |
| `brand-line` | #EADFD8 | 테두리·구분선 |
| `brand-gold` | #FFD23F | 남은 횟수 배지 등 노랑 포인트 |

옛 이름(`brand-violet`, `brand-violet-deep`, `brand-pink`)은 호환을 위해 남아 있으며 값은 코랄 계열이다. 새 코드에서는 `brand-primary` 계열을 쓴다.

### 꿈 등급 (배경 / 글자)
A 최고의 길몽 `#231C17 / #FFE14D` · B 좋은 길몽 `#D3F0DE / #0B6A36` · C 평범한 꿈 `#D6E6FF / #1B4DB3` · D 주의가 필요한 꿈 `#FFE9A8 / #7A4B00` · E 흉몽의 기운 `#FFDDE2 / #9E1530`

### 꿈 종류 태그
길몽 `#DFF3E6 / #17663A` · 흉몽 `#FFE1E5 / #A3182F` · 중립 `#F1ECE8 / #5A4F49`

## 공통 컴포넌트
- **헤더:** 흰 반투명 sticky. 로고(이미지) + 7개 메뉴(드롭다운) + 검색 버튼 + "닉네임님 / 해몽 N회 남음". 모바일은 로고 · 남은 횟수 칩 · 검색 · 햄버거, 햄버거는 오른쪽에서 밀려 나오는 아코디언 메뉴.
- **푸터:** 고객센터(전화·시간·이메일) + 에스크로 안내 + 3열 링크 + 사업자 정보. 값은 `src/lib/siteConfig.ts` 한 곳에서 관리하고, 어드민 "사이트 설정"에서 수정할 수 있게 연결할 예정.
- **플로팅 감정하기 버튼:** 코랄 단색 56px 각진 사각형, 우상단에 노란 남은 횟수 배지.

## 그림자 / 레이아웃 / 타이포 (기존 규칙 유지)
- 정지 상태는 평면(테두리만), hover·모달·드롭다운만 그림자. 그림자 색은 따뜻한 검정(`rgba(35,28,23,…)`).
- 콘텐츠 컨테이너 `max-w-6xl`, 좌우 `px-6`, 전환점 `md:`/`lg:`.
- 제목은 굵게(700~900), 본문 400.
