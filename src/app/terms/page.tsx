import SiteHeader from '@/components/SiteHeader'

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7F5]">
      <SiteHeader />

      <main className="flex-1 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="border border-gray-200 bg-white p-10 shadow-sm">
            <h1 className="mb-2 text-3xl font-bold text-[#01273A]">이용약관</h1>
            <p className="mb-10 text-sm text-[#999]">시행일: 2026년 6월 15일</p>

            <div className="space-y-10 text-[15px] leading-relaxed text-[#444]">

              <section>
                <h2 className="mb-3 text-lg font-bold text-[#01273A]">제1조 (목적)</h2>
                <p>이 약관은 길몽상점(이하 "회사")이 운영하는 길몽상점 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.</p>
              </section>

              <section>
                <h2 className="mb-3 text-lg font-bold text-[#01273A]">제2조 (정의)</h2>
                <ul className="list-disc space-y-2 pl-6">
                  <li>"서비스"란 회사가 제공하는 꿈 감정·거래 플랫폼 및 이와 관련된 제반 서비스를 의미합니다.</li>
                  <li>"이용자"란 이 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
                  <li>"회원"이란 회사에 개인정보를 제공하여 회원 등록을 한 자로서, 회사의 서비스를 이용할 수 있는 자를 말합니다.</li>
                  <li>"꿈"이란 회원이 서비스에 등록한 꿈 내용 및 감정 결과물을 의미합니다.</li>
                  <li>"포인트"란 서비스 내에서 꿈 거래에 사용되는 가상 화폐 단위를 말합니다.</li>
                </ul>
              </section>

              <section>
                <h2 className="mb-3 text-lg font-bold text-[#01273A]">제3조 (약관의 효력 및 변경)</h2>
                <p>① 이 약관은 서비스 화면에 게시하거나 기타 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</p>
                <p className="mt-2">② 회사는 합리적인 사유가 있는 경우 이 약관을 변경할 수 있으며, 변경된 약관은 적용 일자 및 변경 사유를 명시하여 서비스 내 공지합니다.</p>
                <p className="mt-2">③ 이용자가 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</p>
              </section>

              <section>
                <h2 className="mb-3 text-lg font-bold text-[#01273A]">제4조 (회원 가입)</h2>
                <p>① 이용자는 회사가 정한 가입 양식에 따라 회원 정보를 기입한 후 이 약관에 동의한다는 의사 표시를 함으로써 회원 가입을 신청합니다.</p>
                <p className="mt-2">② 회사는 다음 각 호에 해당하는 신청에 대하여는 승낙을 하지 않을 수 있습니다.</p>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                  <li>실명이 아니거나 타인의 명의를 이용한 경우</li>
                  <li>허위의 정보를 기재하거나 회사가 요구하는 정보를 제공하지 않은 경우</li>
                  <li>만 14세 미만 아동인 경우</li>
                  <li>이전에 이용약관 위반으로 제재를 받은 경우</li>
                </ul>
              </section>

              <section>
                <h2 className="mb-3 text-lg font-bold text-[#01273A]">제5조 (포인트 정책)</h2>
                <p>① 포인트는 서비스 내 꿈 구매에 사용됩니다.</p>
                <p className="mt-2">② 포인트 충전은 회사가 지정한 수단을 통해서만 가능합니다.</p>
                <p className="mt-2">③ 꿈 판매 시 판매금액의 90%가 판매자에게 포인트로 지급되며, 10%는 서비스 수수료로 공제됩니다.</p>
                <p className="mt-2">④ 포인트의 현금 출금은 회사가 정한 절차에 따르며, 최소 출금 금액 및 출금 수수료가 발생할 수 있습니다.</p>
                <p className="mt-2">⑤ 구매 완료된 꿈에 대한 환불은 불가합니다. 단, 서비스 결함으로 인한 경우는 회사 정책에 따라 처리합니다.</p>
                <p className="mt-2">⑥ 회원 탈퇴 시 잔여 포인트는 소멸되며 환급되지 않습니다.</p>
              </section>

              <section>
                <h2 className="mb-3 text-lg font-bold text-[#01273A]">제6조 (꿈 콘텐츠 정책)</h2>
                <p>① 회원은 자신이 직접 꾼 꿈의 내용만 등록할 수 있습니다.</p>
                <p className="mt-2">② 다음 각 호에 해당하는 콘텐츠는 등록할 수 없습니다.</p>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                  <li>타인의 개인정보가 포함된 내용</li>
                  <li>음란, 폭력, 혐오 등 사회통념에 반하는 내용</li>
                  <li>허위 또는 과장된 내용</li>
                  <li>타인의 저작권, 상표권 등 지식재산권을 침해하는 내용</li>
                  <li>기타 관련 법령 또는 이 약관에 위반되는 내용</li>
                </ul>
                <p className="mt-2">③ 위반 콘텐츠는 사전 통보 없이 삭제될 수 있으며, 회원의 서비스 이용이 제한될 수 있습니다.</p>
              </section>

              <section>
                <h2 className="mb-3 text-lg font-bold text-[#01273A]">제7조 (서비스 이용 제한)</h2>
                <p>회사는 회원이 다음 각 호에 해당하는 경우 서비스 이용을 제한하거나 계정을 정지·해지할 수 있습니다.</p>
                <ul className="mt-3 list-disc space-y-1 pl-6">
                  <li>이 약관의 의무를 위반한 경우</li>
                  <li>서비스 운영을 고의로 방해한 경우</li>
                  <li>타인의 명의를 도용하거나 결제 정보를 도용한 경우</li>
                  <li>부정한 방법으로 포인트를 취득한 경우</li>
                  <li>기타 정상적인 서비스 운영에 방해가 된다고 판단되는 경우</li>
                </ul>
              </section>

              <section>
                <h2 className="mb-3 text-lg font-bold text-[#01273A]">제8조 (지식재산권)</h2>
                <p>① 회사가 제작한 서비스의 저작권 및 기타 지식재산권은 회사에 귀속됩니다.</p>
                <p className="mt-2">② 회원이 서비스에 등록한 꿈 콘텐츠의 저작권은 해당 회원에게 있으며, 회사는 서비스 운영에 필요한 범위 내에서 이를 사용할 수 있습니다.</p>
                <p className="mt-2">③ 이용자는 서비스를 이용함으로써 얻은 정보를 회사의 사전 승낙 없이 복제, 전송, 출판 등의 방법으로 이용하거나 제3자에게 이용하게 해서는 안 됩니다.</p>
              </section>

              <section>
                <h2 className="mb-3 text-lg font-bold text-[#01273A]">제9조 (면책사항)</h2>
                <p>① 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</p>
                <p className="mt-2">② 회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.</p>
                <p className="mt-2">③ 꿈 감정 결과(등급, 해몽, 행운 번호 등)는 오락·참고 목적으로만 제공되며, 회사는 해당 결과의 정확성이나 특정 결과에 대해 보증하지 않습니다.</p>
              </section>

              <section>
                <h2 className="mb-3 text-lg font-bold text-[#01273A]">제10조 (분쟁 해결)</h2>
                <p>① 서비스 이용과 관련하여 회사와 이용자 간에 분쟁이 발생한 경우 상호 협의를 통해 해결하는 것을 원칙으로 합니다.</p>
                <p className="mt-2">② 협의가 이루어지지 않을 경우 회사의 본사 소재지를 관할하는 법원을 전속 관할 법원으로 합니다.</p>
              </section>

              <section>
                <h2 className="mb-3 text-lg font-bold text-[#01273A]">부칙</h2>
                <p>이 약관은 2026년 6월 15일부터 시행됩니다.</p>
              </section>

            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white px-6 py-10 text-[13px]">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-1 text-[#555555]">
            <span>대표: 홍길몽</span>
            <span>사업자등록번호: 000-00-00000</span>
            <span>주소: 서울특별시 강남구 테헤란로 123</span>
          </div>
          <div className="mt-6 flex flex-wrap gap-5 text-[#555555]">
            <a href="/terms" className="font-semibold text-[#01273A] hover:underline">이용약관</a>
            <a href="/privacy" className="hover:underline">개인정보처리방침</a>
            <a href="/guide" className="hover:underline">이용안내</a>
          </div>
          <p className="mt-4 text-gray-400">© 2026 길몽상점. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
