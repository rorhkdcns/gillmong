export default function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white px-6 py-10 text-[13px]">
      <div className="mx-auto max-w-6xl">

        {/* 고객센터 */}
        <p className="text-sm text-[#555555]">
          고객센터: 이메일 문의 (gillmong@nate.com) · 평일 10:00 ~ 18:00
        </p>

        {/* 사업자 정보 + 카피라이트 */}
        <div className="mt-6 flex flex-col gap-1 text-xs text-[#888888] md:text-right">
          <span>상호명: 티에이치 컴퍼니 · 대표자: 유태현</span>
          <span>사업자등록번호: 795-44-00873 · 통신판매업신고: 제2026-수원팔달-0211호</span>
          <span>주소: 경기도 수원시 팔달구 정조로900번길 23, 104호</span>
          <p className="mt-1 text-gray-400">© 2024 길몽상점. All rights reserved.</p>
        </div>

      </div>
    </footer>
  )
}
