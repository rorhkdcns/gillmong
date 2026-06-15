import Image from 'next/image'
import DreamInput from './_components/DreamInput'

const categories = ['이용방법', '인물·신체', '동물·식물', '자연·사물', '행동·상황', '기타']

const dreamCards = [
  {
    id: 1,
    tags: ['#동물식물', '#길몽'],
    title: '큰 뱀에게 물렸어요',
    body: '어젯밤 꿈에서 커다란 구렁이가 나타나 제 팔을 물었어요. 놀라서 깼는데 기분이 나쁘지 않았어요. 오히려 왠지 좋은 일이 생길 것 같은 느낌이었어요.',
    appraiser: '꿈해몽사 김길몽',
    stars: 4,
    date: '2024.01.15',
  },
  {
    id: 2,
    tags: ['#행동상황', '#길몽'],
    title: '하늘을 자유롭게 날았어요',
    body: '꿈에서 갑자기 몸이 가벼워지더니 하늘로 떠올랐어요. 처음엔 무서웠지만 점점 높이 올라가면서 온 세상이 내려다보이는 기분이었어요.',
    appraiser: '꿈해몽사 박몽상',
    stars: 5,
    date: '2024.01.14',
  },
  {
    id: 3,
    tags: ['#인물신체', '#길몽'],
    title: '돌아가신 할머니를 만났어요',
    body: '오랫동안 보고 싶었던 할머니가 꿈에 나타나셨어요. 환하게 웃으시며 괜찮다고, 잘 될 거라고 하셨어요. 꿈인 줄 알면서도 너무 반가웠어요.',
    appraiser: '꿈해몽사 이몽룡',
    stars: 5,
    date: '2024.01.13',
  },
]

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i < count ? 'text-brand-primary' : 'text-brand-border'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-brand-page">

      {/* ───── 헤더 ───── */}
      <header className="sticky top-0 z-50 border-b border-brand-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">

          <a href="/" className="flex items-center">
            <Image src="/logo.jpg" alt="길몽상점" height={50} width={160} className="h-[50px] w-auto object-contain" priority />
          </a>

          <nav className="hidden items-center gap-7 md:flex">
            {categories.map((cat) => (
              <a
                key={cat}
                href="#"
                className="text-base font-medium text-brand-body transition-colors hover:text-brand-primary"
              >
                {cat}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4 text-brand-muted">
            <button aria-label="검색" className="hover:text-brand-primary">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </button>
            <button aria-label="로그인" className="hover:text-brand-primary">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" />
              </svg>
            </button>
            <button aria-label="장바구니" className="hover:text-brand-primary">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.4 7h12.8M7 13H5.4M10 21a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm7 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ───── 히어로 섹션 ───── */}
      {/* hero.jpg를 public 폴더에 교체하면 배경이 자동으로 바뀝니다 */}
      <section
        className="relative px-6 py-14 text-center"
        style={{
          backgroundColor: '#333333',
          backgroundImage: "url('/hero.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* 어두운 오버레이 — 텍스트 가독성 확보 */}
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 mx-auto max-w-3xl">
          <span className="mb-6 inline-block rounded-full bg-white/20 px-5 py-2 text-base font-semibold text-white ring-1 ring-white/40">
            우리의 모든 꿈은 가치가 있습니다
          </span>
          <h1 className="mb-6 text-3xl font-black leading-tight tracking-wide text-white md:text-5xl">
            꿈은 누구에게나<br />
            기회와 아이디어가<br />
            될 수 있어요
          </h1>
          <p className="mx-auto max-w-lg text-lg leading-relaxed text-white/80">
            길몽상점은 꿈을 통해 나를 이해하고,<br />
            일상의 아이디어를 발견하는 공간입니다.<br />
            당신의 꿈 이야기를 들려주세요.
          </p>
        </div>
      </section>

      {/* ───── 꿈 감정소 ───── */}
      <section className="px-6 pt-16 pb-20">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-brand-border bg-white p-8 shadow-sm">
            <div className="mb-6 text-center">
              <span className="text-3xl">⭐</span>
              <h2 className="mt-2 text-2xl font-black text-brand-heading">꿈 감정소</h2>
              <p className="mt-1 text-sm text-brand-muted">Dream Appraisal Center</p>
            </div>
            <DreamInput />
          </div>
        </div>
      </section>

      {/* ───── EVERYONE'S DREAMS ───── */}
      <section className="border-t border-brand-border bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-brand-primary">Community</p>
            <h2 className="text-3xl font-black text-brand-heading">EVERYONE'S DREAMS</h2>
            <p className="mt-3 text-base text-brand-muted">모든 사람의 꿈에는 의미가 있습니다</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {dreamCards.map((card) => (
              <article
                key={card.id}
                className="flex flex-col rounded-2xl border border-brand-border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {card.tags.map((tag) => (
                    <span key={tag} className="text-base font-semibold text-brand-primary">
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="mb-3 text-xl font-bold text-brand-heading">{card.title}</h3>
                <p className="flex-1 text-base leading-relaxed text-brand-body line-clamp-3">{card.body}</p>
                <div className="mt-5 border-t border-brand-border pt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-base text-brand-muted">감정가</span>
                    <StarRating count={card.stars} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-base text-brand-muted">{card.appraiser}</span>
                    <a href="#" className="text-base font-semibold text-brand-link hover:underline">
                      자세히 보기 →
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button className="rounded-full border-2 border-brand-primary px-10 py-3 text-base font-bold text-brand-primary transition-colors hover:bg-brand-primary hover:text-white">
              꿈 이야기 더 보기
            </button>
          </div>
        </div>
      </section>

      {/* ───── 푸터 ───── */}
      <footer className="border-t border-brand-border bg-white px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6">
            <Image src="/logo.jpg" alt="길몽상점" height={40} width={130} className="h-[40px] w-auto object-contain" />
          </div>

          <div className="mb-6 flex flex-wrap gap-x-6 gap-y-1 text-sm text-brand-muted">
            <span>대표: 홍길몽</span>
            <span>사업자등록번호: 000-00-00000</span>
            <span>통신판매업신고: 제2024-서울-00000호</span>
            <span>주소: 서울특별시 강남구 테헤란로 123</span>
          </div>

          <div className="mb-8 rounded-xl bg-brand-page px-5 py-4 text-base">
            <span className="font-bold text-brand-heading">고객센터</span>
            <span className="mx-3 text-brand-border">|</span>
            <span className="font-bold text-brand-primary">1588-0000</span>
            <span className="ml-3 text-sm text-brand-muted">평일 10:00 – 18:00 (점심 12:00–13:00, 주말·공휴일 휴무)</span>
          </div>

          <div className="flex flex-col gap-4 border-t border-brand-border pt-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-4 text-sm text-brand-muted">
              {['이용약관', '개인정보처리방침', '이용안내', '제휴문의'].map((link) => (
                <a key={link} href="#" className="hover:text-brand-primary">
                  {link}
                </a>
              ))}
            </div>
            <p className="text-sm text-brand-muted">© 2024 길몽상점. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
