'use client'

import { useEffect, useState } from 'react'
import { getSiteInfoForAdmin, saveSiteInfo } from '../actions'
import { SITE_INFO_LABELS } from '@/lib/siteSettings'

const KEYS = Object.keys(SITE_INFO_LABELS) as (keyof typeof SITE_INFO_LABELS)[]

export default function AdminSettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    getSiteInfoForAdmin().then((v) => { setValues((v ?? {}) as Record<string, string>); setLoading(false) })
  }, [])

  async function onSave() {
    setSaving(true); setMsg(null)
    const r = await saveSiteInfo(values)
    setSaving(false)
    setMsg(r.success ? { ok: true, text: '저장했어요. 사이트 하단 정보에 바로 반영돼요.' } : { ok: false, text: r.error ?? '저장 실패' })
  }

  if (loading) return <div className="p-8 text-sm text-gray-400">불러오는 중...</div>

  return (
    <div className="max-w-2xl p-4 sm:p-8">
      <h1 className="mb-1 text-xl font-bold text-[#231C17] sm:text-2xl">사이트 설정</h1>
      <p className="mb-6 text-sm text-[#6B605A]">사이트 맨 아래(푸터)에 보이는 사업자·연락처 정보를 여기서 고쳐요.</p>
      <div className="flex flex-col gap-4 rounded border border-gray-200 bg-white p-5">
        {KEYS.map((k) => (
          <label key={k} className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-[#231C17]">{SITE_INFO_LABELS[k]}</span>
            <input
              value={values[k] ?? ''}
              onChange={(e) => setValues((p) => ({ ...p, [k]: e.target.value }))}
              className="rounded-[3px] border border-gray-300 px-3 py-2 outline-none focus:border-[#E5421F]"
            />
          </label>
        ))}
        <div className="flex items-center gap-3">
          <button onClick={onSave} disabled={saving} className="rounded-[3px] bg-[#E5421F] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#C23A18] disabled:opacity-60">
            {saving ? '저장 중...' : '저장하기'}
          </button>
          {msg && <span className={`text-sm ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>{msg.text}</span>}
        </div>
      </div>
    </div>
  )
}
