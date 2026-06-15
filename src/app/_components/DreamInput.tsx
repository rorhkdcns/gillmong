'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ResultModal from './ResultModal'

const guides = [
  {
    label: '누가/무엇이',
    desc: '나 외에 등장한 특별한 존재나 기묘한 생명체, 인물은?',
  },
  {
    label: '언제/어디서',
    desc: '배경은 언제쯤, 어떤 공간이었나요?',
  },
  {
    label: '어떻게/왜',
    desc: '어떤 신비롭거나 두려운 사건이 일어났고 어떻게 전개되었나요?',
  },
  {
    label: '강렬한 기억',
    desc: '잠에서 깨어난 순간에도 생생한 감정, 감각, 혹은 기억나는 대사는?',
  },
]

const GRADES = ['A', 'B', 'C', 'D', 'E', 'F']

function randomGrade() {
  return GRADES[Math.floor(Math.random() * GRADES.length)]
}

function randomLuckyNumbers() {
  const pool = Array.from({ length: 45 }, (_, i) => i + 1)
  const result: number[] = []
  while (result.length < 6) {
    const idx = Math.floor(Math.random() * pool.length)
    result.push(pool.splice(idx, 1)[0])
  }
  return result.sort((a, b) => a - b)
}

export default function DreamInput() {
  const router = useRouter()
  const [dream, setDream]           = useState('')
  const [dreamError, setDreamError] = useState('')
  const [loading, setLoading]       = useState(false)
  const [modal, setModal]           = useState<{ grade: string; luckyNumbers: number[] } | null>(null)

  async function handleSubmit() {
    if (!dream.trim()) { setDreamError('꿈 내용을 입력해주세요.'); return }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    setDreamError('')
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setModal({
        grade: randomGrade(),
        luckyNumbers: randomLuckyNumbers(),
      })
    }, 2500)
  }

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* 5W1H 가이드 박스 */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          <p className="mb-4 text-base font-bold text-gray-500">
            스토리 완성 가이드 (5W1H)
          </p>
          <ul className="flex flex-col gap-3">
            {guides.map((g) => (
              <li key={g.label} className="flex gap-2 text-base leading-snug">
                <span className="mt-0.5 shrink-0 text-gray-300">◆</span>
                <span>
                  <span className="font-bold text-gray-600">{g.label}:</span>{' '}
                  <span className="text-gray-400">({g.desc})</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* 텍스트에어리어 */}
        <textarea
          value={dream}
          onChange={(e) => { setDream(e.target.value); setDreamError('') }}
          placeholder={`꿈의 내용을 최대한 자세하게 적어주세요.\n\n예) 어젯밤 꿈에서 커다란 뱀이 나타나 나를 쫓아왔어요. 처음엔 무서웠지만 뱀이 갑자기 황금빛으로 빛나더니...`}
          rows={7}
          className="w-full resize-none rounded-xl border border-brand-border bg-white px-5 py-4 text-base text-brand-heading placeholder:text-[#BBBBBB] outline-none"
        />

        {/* 에러 메시지 */}
        {dreamError && (
          <p className="text-sm text-red-500">{dreamError}</p>
        )}

        {/* 버튼 */}
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full rounded-xl py-5 text-xl font-black text-white shadow-md transition-all hover:brightness-90 active:scale-[0.98]"
          style={{ backgroundColor: '#01273A' }}
        >
          나의 꿈 감정하기
        </button>
      </div>

      {/* 로딩 모달 */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl bg-white px-8 py-12 shadow-2xl text-center">
            {/* 스피너 */}
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-gray-200 border-t-gray-400" />
            <div>
              <p className="text-lg font-black text-brand-heading">무의식의 서사를 분석하고 있습니다...</p>
              <p className="mt-2 text-base text-brand-muted">해몽 결과와 가치를 산정하는 중입니다.</p>
            </div>
          </div>
        </div>
      )}

      {/* 결과 모달 */}
      {modal && (
        <ResultModal
          dream={dream || '(입력된 꿈 내용이 없습니다)'}
          grade={modal.grade}
          luckyNumbers={modal.luckyNumbers}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
