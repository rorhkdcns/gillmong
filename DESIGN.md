---
name: 길몽상점
description: AI가 해석한 꿈을 사고파는 P2P 마켓플레이스 — 신뢰감 있는 잉크 톤 위에 선명한 블루 포인트를 얹은 "선명한 꿈 거래소"
colors:
  brand-page: "#F4F7F9"
  brand-surface: "#FFFFFF"
  brand-primary: "#2E7DD1"
  brand-primary-hover: "#14547A"
  brand-primary-light: "#E8F2FA"
  brand-primary-border: "#CFE3F5"
  brand-ink: "#0B2433"
  brand-ink-soft: "#5C6E7C"
  brand-line: "#E2E9EE"
  brand-violet: "#2E7DD1"
  brand-violet-deep: "#14547A"
  brand-pink: "#54D0E0"
  brand-gold: "#F2B33D"
  brand-mint: "#2FB68E"
  brand-warning-text: "#5A3D10"
  brand-slate: "#6B96A8"
typography:
  display:
    fontFamily: "Pretendard Variable, Arial, Helvetica, sans-serif"
    fontSize: "clamp(1.875rem, 4vw, 3rem)"
    fontWeight: 900
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Pretendard Variable, Arial, Helvetica, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 900
    lineHeight: 1.35
  title:
    fontFamily: "Pretendard Variable, Arial, Helvetica, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Pretendard Variable, Arial, Helvetica, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Pretendard Variable, Arial, Helvetica, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.3
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.brand-ink}"
    textColor: "#FFFFFF"
    rounded: "{rounded.full}"
    padding: "14px 32px"
  button-primary-hover:
    backgroundColor: "{colors.brand-primary-hover}"
  button-accent:
    backgroundColor: "{colors.brand-primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.full}"
    padding: "10px 20px"
  button-accent-hover:
    backgroundColor: "{colors.brand-primary-hover}"
  button-ghost:
    backgroundColor: "{colors.brand-primary-light}"
    textColor: "{colors.brand-primary-hover}"
    rounded: "{rounded.full}"
    padding: "8px 20px"
  button-ghost-hover:
    backgroundColor: "{colors.brand-primary}"
    textColor: "#FFFFFF"
  card:
    backgroundColor: "{colors.brand-surface}"
    rounded: "{rounded.md}"
    padding: "24px"
  input:
    backgroundColor: "{colors.brand-surface}"
    textColor: "{colors.brand-ink}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
---

# Design System: 길몽상점

## Overview

**Creative North Star: "The Lucid Market (선명한 꿈 거래소)"**

길몽상점은 몽환적 소재(꿈)를 다루지만, 몽환적으로 디자인하지 않는다. 화면의 대부분은 딥 잉크(`#0B2433`)와 차분한 페이지 배경(`#F4F7F9`) 위에 트러스트 블루(`#2E7DD1`) 포인트를 절제해서 쓰는, 명료하고 신뢰할 수 있는 거래소의 톤이다. 신비로움은 색을 흐리는 방식이 아니라 국소적인 그라디언트(바이올렛→핑크→민트→골드)로만 등장한다 — "꿈 감정하기" CTA 버튼, 안내 배지처럼 이 제품에서 실제로 마법 같은 순간(AI가 꿈을 해석하는 순간)에만 그라디언트가 나타나고, 헤드라인 텍스트를 포함한 상품 목록·표·네비게이션·히어로 타이틀 같은 "거래/정보" 화면은 끝까지 평면적이고 절제된 블루/잉크 단색 팔레트를 유지한다. 그라디언트 텍스트(bg-clip-text)는 쓰지 않는다 — 장식적 강조는 항상 배경이나 버튼에만 준다.

밀도는 낮은 편이다. 카드는 넉넉한 내부 패딩(16–24px)을 쓰고, 섹션 사이는 `border-brand-line`의 얇은 구분선으로만 나뉜다. 배경색 블록이나 굵은 섀도우로 섹션을 가르지 않는다. 형태 언어는 둥긂 쪽으로 확실히 기울어 있다 — 버튼과 배지는 완전한 pill(`rounded-full`), 카드와 모달은 부드러운 12–16px 라운드다. 각진 사각형이나 0 라운드는 이 시스템에 존재하지 않는다.

**Key Characteristics:**
- 잉크(`#0B2433`) + 트러스트 블루(`#2E7DD1`)가 기본 어휘, 그라디언트는 "AI가 꿈을 해석하는 마법의 순간"에 배경/버튼으로만 등장하는 예외적 강조 — 텍스트에는 항상 단색을 쓴다.
- 완전한 pill 버튼·배지, 부드럽게 둥근 카드 — 각진 형태 없음.
- 평소엔 평면(테두리만), 상호작용 시에만 그림자가 뜨는 "Lift-on-Interaction" 입체감.
- 낮은 밀도, 넉넉한 여백, 얇은 구분선으로 나뉘는 섹션 리듬.

## Colors

기본 팔레트는 차분한 블루-그레이 계열(페이지 배경·잉크·구분선)이고, 트러스트 블루 하나가 유일한 상시 포인트다. 확장 팔레트(핑크·골드·민트)는 그라디언트나 등급 배지처럼 국소적인 순간에만 쓰인다.

### Primary
- **Trust Blue** (`#2E7DD1`, `--color-brand-primary`): 버튼·링크·활성 탭·포커스 링의 유일한 상시 포인트 색. 텍스트에는 거의 쓰지 않고 대개 배경/테두리/아이콘으로 등장한다.
- **Trust Blue Hover** (`#14547A`, `--color-brand-primary-hover`): Primary의 hover/active 상태. 그라디언트 CTA의 진한 쪽 끝으로도 쓰인다.
- **Trust Blue Light** (`#E8F2FA`, `--color-brand-primary-light`): 연한 배경 — 고스트 버튼 배경, 활성 드롭다운 항목, 안내 배너 배경.
- **Trust Blue Border** (`#CFE3F5`, `--color-brand-primary-border`): Primary 관련 테두리 (현재 컴포넌트에서 사용 빈도는 낮지만 토큰으로 보존).

### Neutral
- **Deep Ink** (`#0B2433`, `--color-brand-ink` / `--color-brand-dark` / `--color-brand-logo`): 제목·본문 텍스트·로고·헤더 텍스트의 기본색. 검정 대신 항상 이 잉크색을 쓴다.
- **Ink Soft** (`#5C6E7C`, `--color-brand-ink-soft`): 보조 텍스트, 설명문, 비활성 네비게이션 라벨.
- **Page** (`#F4F7F9`, `--color-brand-page`): 페이지 배경. 순백이 아니라 아주 옅은 블루-그레이.
- **Surface** (`#FFFFFF`, `--color-brand-surface`): 카드·헤더·모달 등 콘텐츠가 얹히는 표면.
- **Line** (`#E2E9EE`, `--color-brand-line`): 유일한 구분선/테두리 색. 섹션 구분, 카드 테두리, 헤더/푸터 경계에 전부 이 색을 쓴다.

### 확장 팔레트 (그라디언트·등급 배지 전용)
- **Dream Violet → Dream Pink** (`#2E7DD1` → `#54D0E0`, `--color-brand-violet` / `--color-brand-pink`): "꿈 감정하기" 플로팅 버튼과 감정 모달 CTA 배경에 쓰는 시그니처 그라디언트. 텍스트에는 쓰지 않고 항상 버튼/배경 채움에만 쓴다 — 이 그라디언트가 나오면 사용자는 "지금 AI가 꿈을 해석 중"임을 인지한다.
- **Dream Gold** (`#F2B33D`, `--color-brand-gold`): 플로팅 버튼의 잔여 횟수 배지.
- **Dream Mint** (`#2FB68E`, `--color-brand-mint`): 히어로 슬라이드 배경 그라디언트의 포인트(배경 전용, 텍스트에는 쓰지 않음).
- **등급 배지(A~F)**: `emerald-500`(A) → `blue-500`(B) → `amber-400`(C) → `orange-500`(D) → `red-500`(E) → `gray-400`(F) — Tailwind 표준 팔레트를 그대로 쓰며 brand 토큰과 분리되어 있다. 신호등 순서(좋음→나쁨)를 그대로 색 온도에 매핑한 것이 규칙이다.

### Semantic (역할이 브랜드 색과 분리되는 소수 예외)
- **Warning Umber** (`#5A3D10`, `--color-brand-warning-text`): 해몽사전 "주의" 섹션의 경고형 콘텐츠 텍스트. 항상 옅은 앰버 배경(`#FDF6E8`)과 짝을 이루며, 일반 텍스트(`brand-ink`)와 시각적으로 구분되어야 하는 유일한 케이스라 별도 토큰으로 존재한다.
- **Interpretation Slate** (`#6B96A8`, `--color-brand-slate`): 해몽 결과의 "한국 전통/아시아/서양 심리학/종합 해석" 3색 코드 중 "서양 심리학적 관점" 전용 색. `brand-ink`, `brand-primary-hover`와 함께 관점을 구분하는 신호로만 쓰고 다른 곳에 범용 텍스트색으로 쓰지 않는다.

### Named Rules
**The One Blue Rule.** 상시 상호작용 색은 Trust Blue 하나뿐이다. 새 강조색을 추가하고 싶을 때 먼저 Trust Blue의 밝기/투명도 변형(light/hover)으로 해결되는지 확인한다.

**The Gradient-Means-Magic Rule.** 바이올렛→핑크/골드/민트 그라디언트는 "AI가 지금 꿈을 해석하고 있다" 또는 "이 순간은 특별하다"는 신호로만 쓴다. 목록·표·일반 버튼에 장식으로 쓰지 않고, 텍스트(`bg-clip-text`)에도 쓰지 않는다 — 항상 배경/버튼 채움에만 쓴다.

**The Token-Not-Hex Rule.** 모든 새 UI는 `bg-brand-primary` 같은 `--color-brand-*` 토큰으로 색을 지정한다. `ShopProductGrid`/`ShopSidebar` 등 일부 굿즈샵 컴포넌트가 같은 색을 `#2E7DD1`, `#DCE5EB`, `#5C6E7C` 같은 원시 hex로 하드코딩하고 있는데, 이는 표준이 아니라 기술 부채다 — 새 코드에서 따라 하지 말고, 그 컴포넌트를 만질 일이 있으면 토큰으로 교체한다.

## Typography

**Body/Display Font:** Pretendard Variable (with Arial, Helvetica, sans-serif 폴백) — 로컬 variable font(`--font-pretendard`, weight 45–920)로 로드되며 프로젝트 전체 유일한 서체다.

**Character:** 하나의 variable 서체로 display부터 label까지 전부 커버한다. 위계는 오직 굵기(400/600/900)와 크기로만 만든다 — display와 headline은 항상 font-black(900)으로, 절대 font-bold로 타협하지 않는다.

### Hierarchy
- **Display** (900, `text-3xl md:text-5xl`, leading-snug): 히어로 슬라이드 제목, "꿈 감정소" 같은 섹션 랜딩 타이틀.
- **Headline** (900, `text-xl md:text-2xl`): 모달 타이틀("나의 꿈 감정하기"), 카테고리 섹션 제목.
- **Title** (600, `text-base md:text-lg`): 카드 제목(DreamCard 제목), 입력 필드 라벨.
- **Body** (400, `text-sm md:text-base`, leading-relaxed): 본문 설명, 카드 요약문.
- **Label** (600–700, `text-xs`, 대문자 변환 없음): 배지, 보조 캡션, 글자 수 카운터, 감정가 같은 메타 정보.

### Named Rules
**The No-Regular-Headline Rule.** Display와 Headline 레벨은 항상 font-black(900)이다. font-semibold나 font-bold로 낮추면 이 시스템의 위계가 무너진다.

## Layout

컨테이너는 두 단계로 고정되어 있다: 콘텐츠 섹션은 `max-w-6xl`(1152px), 폼/입력 중심 섹션(꿈 감정소, 로그인)은 `max-w-2xl`~`max-w-[800px]`로 더 좁힌다. 좌우 패딩은 `px-6`이 기본이다.

반응형 전환점은 Tailwind 기본 `md:`(768px)를 일관되게 쓴다 — 헤더 네비게이션, 카드 패딩(`p-4` → `md:p-6`), 폰트 크기(`text-sm` → `md:text-base`)가 전부 이 지점에서 전환된다. 모바일 전용 UI(하단 퀵메뉴 그리드, 플로팅 버튼)는 `md:hidden`으로 데스크탑에서 제거되고, 데스크탑 전용 요소(가로 배치 카드 푸터)는 `hidden md:flex`로 등장한다.

섹션 리듬은 카테고리 홈 화면에서 가장 명확하다: 각 카테고리 섹션은 `py-12`의 수직 여백을 갖고, 첫 섹션을 제외한 모든 섹션은 `border-t border-brand-line`으로만 구분된다 — 배경색을 바꾸거나 그림자를 넣어 구분하지 않는다.

## Elevation & Depth

**The Flat-Then-Lift Rule.** 이 시스템은 평소엔 완전히 평면적이다. 카드·사이드바·헤더는 정지 상태에서 `border-brand-line` 테두리만으로 구분되고 그림자가 없다. 그림자는 오직 상호작용(hover)이나 일시적 레이어(모달, 드롭다운 패널, 플로팅 버튼)에만 등장해 "지금 떠 있다/열렸다"는 신호로 기능한다. 상시 그림자를 새 컴포넌트에 기본값으로 넣지 않는다.

### Shadow Vocabulary
- **hover-lift** (`box-shadow: 0 20px 34px rgba(11,36,51,0.12)`): 카드 hover 시 등장하는 부드러운 잉크색 확산 그림자. DreamCard, 헤더 드롭다운 패널에서 사용.
- **floating-action** (`box-shadow: 0 12px 30px rgba(11,36,51,0.35)`): 플로팅 "꿈 감정하기" 버튼처럼 화면 위에 항상 떠 있는 요소의 진한 상시 그림자. 유일하게 정지 상태에서도 그림자를 갖는 예외 — 이 요소 자체가 "떠 있는" 것이 의미이기 때문이다.
- **modal** (`box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25)` / Tailwind `shadow-2xl`): 모달·사이드 패널 등 오버레이 레이어.
- **subtle-surface** (`box-shadow: 0 1px 3px rgba(11,36,51,0.06)`): 굿즈샵 카드/사이드바에 쓰이는 아주 약한 상시 그림자 — 홈/마켓 카드의 "Flat-Then-Lift"와는 다른 예외적 패턴이니 새 컴포넌트에서 기본으로 따라 하지 않는다.

## Shapes

라운드는 확실히 "둥근" 쪽으로 기울어 있고, 요소의 상호작용성이 높을수록 더 완전한 원에 가까워진다. 버튼·배지·pill·아바타는 `rounded-full`, 카드·모달·입력창은 12–16px(`rounded-xl`/`rounded-2xl`), 작은 아이콘 타일(모바일 퀵메뉴)은 12px(`rounded-[12px]`)이다. 직각 모서리(`rounded-none`)는 코드베이스에 등장하지 않는다. 테두리는 얇고(`border` 1px) 항상 `brand-line` 색이며, 강조 테두리(입력 포커스, 안내 배너)만 예외적으로 `border-l-4` 같은 두꺼운 좌측 테두리를 쓴다.

## Components

### Buttons
- **Shape:** 완전한 pill (`rounded-full`).
- **Primary (다크):** 배경 `brand-ink`(#0B2433), 흰 텍스트, hover 시 `brand-primary-hover`. 검색 제출, 히어로의 다크 CTA에 사용.
- **Accent (블루):** 배경 `brand-primary`, 흰 텍스트. 페이지 전환·확정 액션.
- **Ghost:** 배경 `brand-primary-light`, 텍스트 `brand-primary-hover`, hover 시 배경이 `brand-primary`로 채워지며 텍스트가 흰색으로 반전(DreamCard "자세히 보기"). "약한 강조 → hover 시 확실한 강조"로 전환되는 것이 이 변형의 정체성이다.
- **시그니처 그라디언트 버튼:** `brand-violet → brand-pink` 그라디언트 배경, 흰 텍스트, font-black. "꿈 감정하기" 계열 CTA 전용 — 다른 액션에 재사용하지 않는다.
- **Hover/Focus:** 색상 전환은 `transition-colors`, 그라디언트 버튼은 `hover:brightness-95`, 플로팅 버튼은 `hover:scale-105`로 살짝 확대.

### Chips / Badges
- **등급 배지:** `h-5 w-5`~`h-6 w-6`의 완전한 원, Tailwind 표준 색(`emerald-500` 등)으로 채워진 배경에 흰 글자.
- **상태 배지(판매완료 등):** `rounded-full bg-gray-400 text-white`, 텍스트는 `text-xs font-bold`.
- **드롭다운 활성 항목:** 배경 `brand-primary-light`, 텍스트 `brand-primary`/`brand-primary-hover`.

### Cards / Containers
- **Corner Style:** 12–16px 라운드(`rounded-xl md:rounded-2xl`).
- **Background:** `brand-surface`(#FFFFFF), 판매완료 등 비활성 상태는 `bg-gray-50` + `opacity-70`.
- **Shadow Strategy:** 정지 시 무그림자, hover 시 `hover-lift` (Elevation 섹션 참고).
- **Border:** 항상 1px `brand-line`.
- **Internal Padding:** `p-4 md:p-6` (16px → 24px).

### Inputs / Fields
- **Style:** 1px `brand-line` 테두리, `brand-surface` 배경, 12px 라운드(`rounded-xl`).
- **Focus:** 테두리가 `brand-violet`로 바뀌고 `box-shadow: 0 0 0 3px rgba(46,125,209,0.14)`의 부드러운 글로우가 더해진다. outline은 제거하고 이 글로우가 유일한 포커스 표시다.
- **Placeholder:** 옅은 회색(`#BBBBBB`), 본문 텍스트보다 눈에 띄게 연하게.

### Navigation
- **데스크탑 헤더:** `bg-white/85 backdrop-blur-lg`로 스크롤 시 반투명 유리 효과, `sticky top-0`. 네브 항목은 `font-semibold text-brand-ink-soft`이고 hover/활성 시 `text-brand-ink`로 진해진다 — 색이 바뀌는 게 아니라 명도만 바뀌는 것이 규칙.
- **드롭다운:** hover로 열리는 패널, `rounded-2xl border border-brand-line bg-white shadow-[0_14px_34px_rgba(11,36,51,0.12)]`, 각 항목은 hover 시 `bg-brand-primary-light`.
- **모바일:** 우측에서 슬라이드 인하는 전체 높이 패널(`translate-x-full` → `translate-x-0`), 드롭다운은 아코디언으로 전개.

### 등급 시스템 (Signature Component)
A~F 등급은 색상(신호등 스펙트럼) + 원형 배지 + 설명 라벨의 3중 부호화로 표현된다. 등급 색상은 brand 팔레트가 아니라 Tailwind 표준 색을 의도적으로 쓰는 유일한 예외로, "이건 브랜드 색이 아니라 객관적 평가 신호"라는 것을 시각적으로도 구분하기 위함이다.

## Do's and Don'ts

### Do:
- **Do** 상시 상호작용 강조색은 Trust Blue(`brand-primary`) 하나로 통일한다.
- **Do** 버튼·배지·pill류는 `rounded-full`로, 카드·모달·입력창은 12–16px 라운드로 통일한다.
- **Do** 카드·리스트는 정지 시 무그림자(테두리만), hover·모달 등 일시적 레이어에서만 그림자를 준다.
- **Do** display/headline 레벨 타이포그래피는 항상 font-black(900)을 쓴다.
- **Do** 새 색상은 `bg-brand-*` / `text-brand-*` 토큰으로 지정한다.
- **Do** 바이올렛→핑크/골드/민트 그라디언트는 "AI가 꿈을 해석하는 순간"에만 예외적으로 쓴다.

### Don't:
- **Don't** 그라디언트를 일반 버튼·표·목록의 장식으로 남용하지 않는다 — 의미(AI 해석 중)를 잃는다.
- **Don't** `bg-clip-text`로 텍스트에 그라디언트를 입히지 않는다 — 그라디언트는 배경/버튼 채움 전용이다.
- **Don't** 새 컴포넌트에 원시 hex 색상(`#2E7DD1` 등)을 하드코딩하지 않는다. 굿즈샵 일부 컴포넌트의 하드코딩은 기술 부채이지 패턴이 아니다.
- **Don't** 각진 모서리(`rounded-none`)나 순검정 텍스트를 쓰지 않는다 — 텍스트는 항상 `brand-ink`.
- **Don't** 정지 상태의 카드/리스트에 상시 그림자를 기본값으로 넣지 않는다.
- **Don't** 등급 배지 색(A~F)을 brand 팔레트로 교체하지 않는다 — 신호등 스펙트럼이 의도된 예외다.
