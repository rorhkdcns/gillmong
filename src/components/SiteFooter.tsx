export default function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white px-6 py-10 text-[13px]">
      <div className="mx-auto max-w-6xl">

        {/* 고객센터 */}
        <div className="flex flex-col gap-0.5 text-sm text-[#555555]">
          <span>고객센터 : admin@gillmong.com</span>
          <span>운영시간 : 평일 10:00 ~ 18:00</span>
        </div>

        {/* 사업자 정보 + 카피라이트 */}
        <div className="mt-6 flex flex-col gap-1 text-xs text-[#888888]">
          <span>상호명: 티에이치 컴퍼니 · 대표자: 유태현</span>
          <span>사업자등록번호: 795-44-00873 · 통신판매업신고: 제2026-수원팔달-0211호</span>
          <span>주소: 경기도 수원시 팔달구 정조로900번길 23, 104호</span>
          <div className="mt-2 flex flex-col gap-1 text-gray-400">
            <div className="flex items-center gap-3">
              <a href="/terms"   className="hover:underline">이용약관</a>
              <span>·</span>
              <a href="/privacy" className="hover:underline">개인정보처리방침</a>
            </div>
            <span>© 2024 길몽상점. All rights reserved.</span>
          </div>
        </div>

      </div>
    </footer>
  )
}
