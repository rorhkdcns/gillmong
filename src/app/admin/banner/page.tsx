'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Banner {
  id: number
  image_url: string
  link_url: string
  order: number
  is_active: boolean
}

export default function AdminBannerPage() {
  const [banners, setBanners]           = useState<Banner[]>([])
  const [loading, setLoading]           = useState(true)
  const [uploading, setUploading]       = useState(false)
  const [msg, setMsg]                   = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [linkUrl, setLinkUrl]           = useState('/')
  const [order, setOrder]               = useState(0)
  const [imageFile, setImageFile]       = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function fetchBanners() {
    const supabase = createClient()
    const { data } = await supabase
      .from('banners')
      .select('*')
      .order('order', { ascending: true })
    setBanners(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchBanners() }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setMsg(null)
  }

  async function handleAdd() {
    if (!imageFile) { setMsg({ type: 'error', text: '이미지를 선택해주세요.' }); return }
    setUploading(true)
    setMsg(null)

    const supabase = createClient()
    const ext  = imageFile.name.split('.').pop() ?? 'jpg'
    const path = `banner_${Date.now()}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('banners')
      .upload(path, imageFile, { upsert: true })

    if (uploadErr) {
      setMsg({ type: 'error', text: `이미지 업로드 실패: ${uploadErr.message}` })
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(path)

    const { error: insertErr } = await supabase.from('banners').insert({
      image_url: publicUrl,
      link_url:  linkUrl || '/',
      order,
      is_active: true,
    })

    setUploading(false)

    if (insertErr) {
      setMsg({ type: 'error', text: `등록 실패: ${insertErr.message}` })
      return
    }

    setMsg({ type: 'success', text: '배너가 등록됐습니다.' })
    setImageFile(null)
    setImagePreview('')
    setLinkUrl('/')
    setOrder(0)
    if (fileRef.current) fileRef.current.value = ''
    fetchBanners()
  }

  async function handleDelete(id: number) {
    const supabase = createClient()
    await supabase.from('banners').delete().eq('id', id)
    fetchBanners()
  }

  async function toggleActive(id: number, current: boolean) {
    const supabase = createClient()
    await supabase.from('banners').update({ is_active: !current }).eq('id', id)
    fetchBanners()
  }

  return (
    <div className="p-8">
      <h1 className="mb-2 text-2xl font-bold text-[#01273A]">슬라이드 배너 관리</h1>
      <p className="mb-8 text-sm text-[#999]">
        메인 페이지 상단 슬라이드 배너를 관리합니다. 활성화된 배너만 순서대로 표시됩니다.
      </p>

      {/* ─ 새 배너 추가 폼 ─ */}
      <div className="mb-10 max-w-xl space-y-4 rounded border border-gray-200 bg-white p-6">
        <h2 className="text-base font-bold text-[#01273A]">새 배너 추가</h2>

        <div>
          <label className="mb-1 block text-sm font-semibold text-[#333]">배너 이미지 *</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-sm text-gray-600 file:mr-3 file:border-0 file:bg-[#01273A] file:px-4 file:py-2 file:text-white file:text-sm file:cursor-pointer hover:file:brightness-90"
          />
          {imagePreview && (
            <img src={imagePreview} alt="미리보기" className="mt-3 h-32 w-full rounded object-cover" />
          )}
          <p className="mt-1 text-xs text-[#aaa]">권장 비율 16:5 (예: 1600×500px)</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-[#333]">클릭 시 이동 URL</label>
          <input
            type="text"
            value={linkUrl}
            onChange={(e) => { setLinkUrl(e.target.value); setMsg(null) }}
            placeholder="/ 또는 https://..."
            className="w-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-[#01273A]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-[#333]">표시 순서</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={order}
              onChange={(e) => { setOrder(Number(e.target.value)); setMsg(null) }}
              className="w-24 border border-gray-300 px-4 py-2 text-sm outline-none focus:border-[#01273A]"
            />
            <span className="text-xs text-gray-400">숫자가 작을수록 먼저 표시</span>
          </div>
        </div>

        {msg && (
          <div className={`rounded px-4 py-3 text-sm ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            {msg.text}
          </div>
        )}

        <button
          onClick={handleAdd}
          disabled={uploading}
          className="w-full bg-[#01273A] py-3 text-sm font-semibold text-white hover:brightness-90 disabled:opacity-60"
        >
          {uploading ? '업로드 중...' : '배너 추가'}
        </button>

        <p className="text-xs text-[#bbb]">
          Supabase Storage에 <code className="rounded bg-gray-100 px-1">banners</code> 퍼블릭 버킷이 필요합니다.
        </p>
      </div>

      {/* ─ 등록된 배너 목록 ─ */}
      <div className="max-w-3xl">
        <h2 className="mb-4 text-base font-bold text-[#01273A]">
          등록된 배너 ({banners.length}개)
        </h2>

        {loading ? (
          <p className="text-sm text-gray-400">불러오는 중...</p>
        ) : banners.length === 0 ? (
          <p className="rounded border border-dashed border-gray-300 py-10 text-center text-sm text-gray-400">
            등록된 배너가 없습니다
          </p>
        ) : (
          <div className="space-y-3">
            {banners.map((b) => (
              <div key={b.id} className="flex items-center gap-4 rounded border border-gray-200 bg-white p-4">
                <img
                  src={b.image_url}
                  alt=""
                  className="h-16 w-28 shrink-0 rounded object-cover bg-gray-100"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#333]">{b.link_url}</p>
                  <p className="mt-0.5 text-xs text-gray-400">순서 {b.order}</p>
                </div>
                <button
                  onClick={() => toggleActive(b.id, b.is_active)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    b.is_active
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {b.is_active ? '활성' : '비활성'}
                </button>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="shrink-0 rounded border border-red-200 px-3 py-1 text-xs text-red-500 hover:bg-red-50"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
