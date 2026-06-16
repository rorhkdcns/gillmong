import SiteHeader from '@/components/SiteHeader'

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7F5]">
      <SiteHeader />

      <main className="flex-1 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="border border-gray-200 bg-white p-10 shadow-sm">
            <h1 className="mb-2 text-3xl font-bold text-[#01273A]">개인정보처리방침</h1>
            <p className="mb-10 text-sm text-[#999]">시행일: 2026년 6월 15일</p>

            <div className="space-y-10 text-[15px] leading-relaxed text-[#444]">

              <section>
                <h2 className="mb-3 text-lg font-bold text-[#01273A]">제1조 (개인정보의 처리 목적)</h2>
                <p>길몽상점(이하 "회사")은 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
                <ul className="mt-3 list-disc space-y-1 pl-6">
                  <li>회원 가입 및 관리: 회원제 서비스 이용에 따른 본인 식별·인증, 회원자격 유지·관리</li>
                  <li>서비스 제공: 꿈 감정 서비스, 마켓 거래 서비스, 포인트 운영</li>
                  <li>고충 처리: 민원인 식별, 민원 사항 확인 및 처리 결과 통보</li>
                  <li>마케팅·광고 활용: 이벤트 안내, 서비스 관련 정보 제공 (동의한 경우에 한함)</li>
                </ul>
              </section>

              <section>
                <h2 className="mb-3 text-lg font-bold text-[#01273A]">제2조 (처리하는 개인정보 항목)</h2>
                <p className="mb-2">회사는 다음의 개인정보 항목을 처리하고 있습니다.</p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#F7F7F5] text-[#333]">
                        <th className="border border-gray-200 px-4 py-2 text-left">구분</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">항목</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">수집 방법</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-200 px-4 py-2">필수</td>
                        <td className="border border-gray-200 px-4 py-2">이메일, 닉네임, 아이디</td>
                        <td className="border border-gray-200 px-4 py-2">회원 가입 시 입력</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-4 py-2">자동 수집</td>
                        <td className="border border-gray-200 px-4 py-2">서비스 이용 기록, IP 주소, 쿠키</td>
                        <td className="border border-gray-200 px-4 py-2">서비스 이용 중 자동 생성</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-4 py-2">출금 신청 시</td>
                        <td className="border border-gray-200 px-4 py-2">은행명, 계좌번호, 예금주명</td>
                        <td className="border border-gray-200 px-4 py-2">출금 신청 시 입력</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-lg font-bold text-[#01273A]">제3조 (개인정보의 처리 및 보유 기간)</h2>
                <p>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의 받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
                <ul className="mt-3 list-disc space-y-1 pl-6">
                  <li>회원 정보: 회원 탈퇴 시까지 (탈퇴 후 즉시 파기)</li>
                  <li>거래 기록: 전자상거래법에 따라 5년 보존</li>
                  <li>서비스 이용 기록: 3개월</li>
                </ul>
              </section>

              <section>
                <h2 className="mb-3 text-lg font-bold text-[#01273A]">제4조 (개인정보의 제3자 제공)</h2>
                <p>회사는 정보주체의 개인정보를 제1조에서 명시한 목적 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보보호법 제17조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다. 현재 회사는 개인정보를 제3자에게 제공하지 않습니다.</p>
              </section>

              <section>
                <h2 className="mb-3 text-lg font-bold text-[#01273A]">제5조 (개인정보처리의 위탁)</h2>
                <p>회사는 서비스 제공을 위해 아래와 같이 개인정보 처리 업무를 위탁하고 있습니다.</p>
                <ul className="mt-3 list-disc space-y-1 pl-6">
                  <li>Supabase Inc.: 데이터베이스 및 인증 서비스 운영</li>
                  <li>결제대행사 (추후 도입 시 고지): 포인트 충전 결제 처리</li>
                </ul>
              </section>

              <section>
                <h2 className="mb-3 text-lg font-bold text-[#01273A]">제6조 (정보주체의 권리·의무 및 행사방법)</h2>
                <p>정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.</p>
                <ul className="mt-3 list-disc space-y-1 pl-6">
                  <li>개인정보 열람 요구</li>
                  <li>오류 등이 있을 경우 정정 요구</li>
                  <li>삭제 요구</li>
                  <li>처리 정지 요구</li>
                </ul>
                <p className="mt-3">권리 행사는 고객센터(이메일: privacy@gillmong.com)를 통해 하실 수 있으며, 회사는 이에 대해 지체 없이 조치하겠습니다.</p>
              </section>

              <section>
                <h2 className="mb-3 text-lg font-bold text-[#01273A]">제7조 (개인정보의 파기)</h2>
                <p>회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.</p>
                <ul className="mt-3 list-disc space-y-1 pl-6">
                  <li>전자적 파일 형태: 복원이 불가능한 방법으로 영구 삭제</li>
                  <li>종이 문서: 분쇄 또는 소각</li>
                </ul>
              </section>

              <section>
                <h2 className="mb-3 text-lg font-bold text-[#01273A]">제8조 (개인정보 보호책임자)</h2>
                <p>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 정보주체의 개인정보 관련 불만 처리 및 피해구제를 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
                <div className="mt-3 rounded bg-[#F7F7F5] px-5 py-4 text-sm">
                  <p><span className="font-semibold">개인정보 보호책임자:</span> 홍길몽</p>
                  <p className="mt-1"><span className="font-semibold">이메일:</span> privacy@gillmong.com</p>
                  <p className="mt-1"><span className="font-semibold">전화:</span> 1588-0000</p>
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-lg font-bold text-[#01273A]">제9조 (권익침해 구제방법)</h2>
                <p>개인정보 침해에 대한 피해구제, 상담 등을 위해 아래 기관에 문의하실 수 있습니다.</p>
                <ul className="mt-3 list-disc space-y-1 pl-6">
                  <li>개인정보보호위원회 (www.pipc.go.kr / 국번없이 182)</li>
                  <li>개인정보 침해신고센터 (privacy.kisa.or.kr / 국번없이 118)</li>
                  <li>대검찰청 사이버범죄수사단 (www.spo.go.kr / 02-3480-3573)</li>
                  <li>경찰청 사이버안전국 (cyberbureau.police.go.kr / 국번없이 182)</li>
                </ul>
              </section>

            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white px-6 py-10 text-[13px]">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-1 text-[#555555]">
            <span>상호명: 티에이치 컴퍼니</span>
            <span>대표자: 유태현</span>
            <span>사업자등록번호: 795-44-00873</span>
            <span>통신판매업신고: 제2026-수원팔달-0211호</span>
            <span>주소: 경기도 수원시 팔달구 정조로900번길 23, 104호</span>
            <span className="mt-2">고객센터: 이메일 문의 (gillmong@nate.com) · 평일 10:00 ~ 18:00</span>
          </div>
          <div className="mt-6 flex flex-wrap gap-5 text-[#555555]">
            <a href="/terms" className="hover:underline">이용약관</a>
            <a href="/privacy" className="font-semibold text-[#01273A] hover:underline">개인정보처리방침</a>
            <a href="/guide" className="hover:underline">이용안내</a>
          </div>
          <p className="mt-4 text-gray-400">© 2026 길몽상점. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
