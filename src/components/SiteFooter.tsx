export default function SiteFooter() {
  return (
    <footer className="border-t border-brand-line bg-white px-6 py-10 text-center text-sm">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4">

        {/* 고객센터 */}
        <div className="flex flex-col items-center gap-0.5 text-sm text-brand-ink-soft">
          <span>고객센터 : admin@gillmong.com</span>
          <span>운영시간 : 평일 10:00 ~ 18:00</span>
        </div>

        {/* 약관 링크 */}
        <div className="flex items-center gap-3 text-sm font-medium text-brand-ink-soft">
          <a href="/terms" className="hover:text-brand-ink">이용약관</a>
          <span className="text-brand-line">·</span>
          <a href="/privacy" className="hover:text-brand-ink">개인정보처리방침</a>
          <span className="text-brand-line">·</span>
          <a href="/support" className="hover:text-brand-ink">고객지원</a>
        </div>

        {/* 사업자 정보 + 카피라이트 */}
        <div className="flex flex-col items-center gap-1 text-xs text-brand-ink-soft/70">
          <span>상호명: 티에이치 컴퍼니 · 대표자: 유태현</span>
          <span>사업자등록번호: 795-44-00873 · 통신판매업신고: 제2026-수원팔달-0211호</span>
          <span>주소: 경기도 수원시 팔달구 정조로900번길 23, 104호</span>
          <span className="mt-1">© 2024 길몽상점. All rights reserved.</span>
        </div>

      </div>
    </footer>
  )
}
