'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface BannerSettings {
  headline: string
  subheadline: string
  cta_text: string
  image_url: string
}

const DEFAULT: BannerSettings = {
  headline:    '당신의 꿈, 지금 팔 수 있습니다',
  subheadline: '길몽상점에서 꿈을 감정하고 포인트로 교환하세요',
  cta_text:    '지금 감정받기',
  image_url:   '',
}

export default function AdminBanner() {
  const [form, setForm]   = useState<BannerSettings>(DEFAULT)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]     = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function set(key: keyof BannerSettings, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setMsg(null)
  }

  async function handleSave() {
    setSaving(true)
    setMsg(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: 'banner', value: form }, { onConflict: 'key' })
    setSaving(false)
    if (error) {
      setMsg({ type: 'error', text: `저장 실패: ${error.message} — site_settings 테이블이 필요합니다.` })
    } else {
      setMsg({ type: 'success', text: '배너 설정이 저장됐습니다.' })
    }
  }

  return (
    <div className="p-8">
      <h1 className="mb-2 text-2xl font-bold text-[#01273A]">배너 관리</h1>
      <p className="mb-8 text-sm text-[#999]">메인 히어로 섹션의 텍스트와 이미지를 수정합니다.</p>

      <div className="max-w-xl space-y-5 rounded border border-gray-200 bg-white p-8">
        <div>
          <label className="mb-1 block text-sm font-semibold text-[#333]">헤드라인</label>
          <input type="text" value={form.headline} onChange={(e) => set('headline', e.target.value)}
            className="w-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-[#01273A]" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-[#333]">서브 헤드라인</label>
          <input type="text" value={form.subheadline} onChange={(e) => set('subheadline', e.target.value)}
            className="w-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-[#01273A]" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-[#333]">CTA 버튼 텍스트</label>
          <input type="text" value={form.cta_text} onChange={(e) => set('cta_text', e.target.value)}
            className="w-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-[#01273A]" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-[#333]">배너 이미지 URL</label>
          <input type="text" value={form.image_url} onChange={(e) => set('image_url', e.target.value)}
            placeholder="https://..."
            className="w-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-[#01273A]" />
          {form.image_url && (
            <img src={form.image_url} alt="미리보기" className="mt-3 h-32 w-full rounded object-cover" />
          )}
        </div>

        {msg && (
          <div className={`rounded px-4 py-3 text-sm ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            {msg.text}
          </div>
        )}

        <button onClick={handleSave} disabled={saving}
          className="w-full bg-[#01273A] py-3 text-sm font-semibold text-white hover:brightness-90 disabled:opacity-60">
          {saving ? '저장 중...' : '저장하기'}
        </button>

        <p className="text-center text-xs text-[#999]">
          저장하려면 Supabase에 <code className="rounded bg-gray-100 px-1">site_settings (key text, value jsonb)</code> 테이블이 필요합니다.
        </p>
      </div>
    </div>
  )
}
