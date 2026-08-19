'use client'

import { useMemo, useState } from 'react'
import { lunarToSolar } from 'manseryeok'
import {
  ZODIAC_ANIMALS,
  STAR_SIGNS,
  getZodiacKeyByYear,
  getStarSignKeyByDate,
} from '@/lib/fortune'

interface Props {
  date: string
  zodiacFortunes: Record<string, string>
  starFortunes: Record<string, string>
}

type Tab = 'zodiac' | 'star'

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

function computeAutoZodiac(
  yearRaw: string,
  calendarType: 'solar' | 'lunar',
  monthRaw: string,
  dayRaw: string,
): { key: string | null; note: string | null } {
  const year = Number(yearRaw)
  if (!yearRaw.trim() || !Number.isInteger(year) || year < 1) return { key: null, note: null }

  if (calendarType === 'solar') return { key: getZodiacKeyByYear(year), note: null }

  const month = Number(monthRaw)
  const day = Number(dayRaw)
  const hasMonthDay = monthRaw.trim() !== '' && dayRaw.trim() !== '' && Number.isInteger(month) && Number.isInteger(day)

  if (!hasMonthDay) {
    return { key: getZodiacKeyByYear(year), note: '정확한 결과를 원하시면 음력 월/일도 함께 입력해주세요' }
  }

  try {
    const solar = lunarToSolar(year, month, day, false)
    return { key: getZodiacKeyByYear(solar.year), note: null }
  } catch {
    return { key: null, note: '입력한 음력 날짜를 변환할 수 없습니다. 연도·월·일을 다시 확인해주세요' }
  }
}

export default function FortuneTabs({ date, zodiacFortunes, starFortunes }: Props) {
  const [tab, setTab] = useState<Tab>('zodiac')

  // 띠 탭 — 태어난 연도(양력/음력)
  const [birthYear, setBirthYear] = useState('')
  const [calendarType, setCalendarType] = useState<'solar' | 'lunar'>('solar')
  const [lunarMonth, setLunarMonth] = useState('')
  const [lunarDay, setLunarDay] = useState('')
  const [selectedZodiac, setSelectedZodiac] = useState<string | null>(null)

  // 별자리 탭 — 생일(월/일)
  const [starMonth, setStarMonth] = useState('')
  const [starDay, setStarDay] = useState('')
  const [selectedStar, setSelectedStar] = useState<string | null>(null)

  const { key: autoZodiac, note: zodiacNote } = useMemo(
    () => computeAutoZodiac(birthYear, calendarType, lunarMonth, lunarDay),
    [birthYear, calendarType, lunarMonth, lunarDay],
  )

  const autoStar = useMemo(() => {
    const month = Number(starMonth)
    const day = Number(starDay)
    if (!starMonth || !starDay || !Number.isInteger(month) || !Number.isInteger(day)) return null
    return getStarSignKeyByDate(month, day)
  }, [starMonth, starDay])

  const displayZodiac = selectedZodiac ?? autoZodiac
  const displayStar = selectedStar ?? autoStar

  return (
    <div className="rounded-[14px] bg-white p-[20px_18px] shadow-[0_1px_3px_rgba(11,36,51,0.06)] md:p-[26px_24px]">

      {/* 탭 전환 */}
      <div className="mb-5 flex gap-1.5">
        {(['zodiac', 'star'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-[10px] px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === t
                ? 'bg-brand-ink text-white'
                : 'border border-brand-line text-brand-ink-soft hover:border-brand-primary hover:text-brand-primary'
            }`}
          >
            {t === 'zodiac' ? '띠' : '별자리'}
          </button>
        ))}
      </div>

      {tab === 'zodiac' ? (
        <div>
          {/* 태어난 연도 입력 */}
          <div className="mb-5 rounded-[10px] border border-brand-line p-3.5">
            <div className="mb-2.5 flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={birthYear}
                onChange={(e) => { setBirthYear(e.target.value); setSelectedZodiac(null) }}
                placeholder="태어난 연도 (예: 1992)"
                className="w-40 rounded-[8px] border border-brand-line bg-white px-3 py-2 text-sm text-brand-ink outline-none focus:border-brand-primary"
              />
              <div className="flex gap-1">
                {(['solar', 'lunar'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { setCalendarType(c); setSelectedZodiac(null) }}
                    className={`rounded-[8px] px-3 py-2 text-xs font-semibold transition-colors ${
                      calendarType === c
                        ? 'bg-brand-primary text-white'
                        : 'border border-brand-line text-brand-ink-soft hover:border-brand-primary hover:text-brand-primary'
                    }`}
                  >
                    {c === 'solar' ? '양력' : '음력'}
                  </button>
                ))}
              </div>
            </div>

            {calendarType === 'lunar' && (
              <div className="flex items-center gap-2">
                <select
                  value={lunarMonth}
                  onChange={(e) => { setLunarMonth(e.target.value); setSelectedZodiac(null) }}
                  className="rounded-[8px] border border-brand-line bg-white px-2.5 py-2 text-sm text-brand-ink outline-none focus:border-brand-primary"
                >
                  <option value="">음력 월</option>
                  {MONTHS.map((m) => <option key={m} value={m}>{m}월</option>)}
                </select>
                <select
                  value={lunarDay}
                  onChange={(e) => { setLunarDay(e.target.value); setSelectedZodiac(null) }}
                  className="rounded-[8px] border border-brand-line bg-white px-2.5 py-2 text-sm text-brand-ink outline-none focus:border-brand-primary"
                >
                  <option value="">음력 일</option>
                  {DAYS.map((d) => <option key={d} value={d}>{d}일</option>)}
                </select>
                <span className="text-xs text-brand-ink-soft">(선택 사항, 있으면 더 정확해요)</span>
              </div>
            )}

            {zodiacNote && <p className="mt-2 text-xs text-brand-ink-soft">{zodiacNote}</p>}
          </div>

          <FortuneGrid
            items={ZODIAC_ANIMALS.map((a) => ({ key: a.key, icon: a.emoji }))}
            selectedKey={displayZodiac}
            onSelect={(key) => setSelectedZodiac(key)}
          />

          <FortuneContent
            date={date}
            selectedKey={displayZodiac}
            content={displayZodiac ? zodiacFortunes[displayZodiac] : undefined}
            emptyHint="띠를 선택하거나 태어난 연도를 입력해보세요"
          />
        </div>
      ) : (
        <div>
          {/* 생일 입력 */}
          <div className="mb-5 rounded-[10px] border border-brand-line p-3.5">
            <div className="flex items-center gap-2">
              <select
                value={starMonth}
                onChange={(e) => { setStarMonth(e.target.value); setSelectedStar(null) }}
                className="rounded-[8px] border border-brand-line bg-white px-2.5 py-2 text-sm text-brand-ink outline-none focus:border-brand-primary"
              >
                <option value="">생일 월</option>
                {MONTHS.map((m) => <option key={m} value={m}>{m}월</option>)}
              </select>
              <select
                value={starDay}
                onChange={(e) => { setStarDay(e.target.value); setSelectedStar(null) }}
                className="rounded-[8px] border border-brand-line bg-white px-2.5 py-2 text-sm text-brand-ink outline-none focus:border-brand-primary"
              >
                <option value="">생일 일</option>
                {DAYS.map((d) => <option key={d} value={d}>{d}일</option>)}
              </select>
              <span className="text-xs text-brand-ink-soft">(선택 사항)</span>
            </div>
          </div>

          <FortuneGrid
            items={STAR_SIGNS.map((s) => ({ key: s.key, icon: s.symbol, sub: s.label }))}
            selectedKey={displayStar}
            onSelect={(key) => setSelectedStar(key)}
          />

          <FortuneContent
            date={date}
            selectedKey={displayStar}
            content={displayStar ? starFortunes[displayStar] : undefined}
            emptyHint="별자리를 선택하거나 생일을 입력해보세요"
          />
        </div>
      )}
    </div>
  )
}

function FortuneGrid({
  items,
  selectedKey,
  onSelect,
}: {
  items: { key: string; icon: string; sub?: string }[]
  selectedKey: string | null
  onSelect: (key: string) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
      {items.map((item) => {
        const active = item.key === selectedKey
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
            className={`flex flex-col items-center gap-1.5 rounded-[12px] border p-3 text-center transition-all ${
              active
                ? 'border-brand-primary bg-brand-primary-light'
                : 'border-brand-line bg-white hover:shadow-[0_20px_34px_rgba(11,36,51,0.12)]'
            }`}
          >
            <span className="text-2xl leading-none">{item.icon}</span>
            <span className={`text-sm font-semibold ${active ? 'text-brand-primary-hover' : 'text-brand-ink'}`}>
              {item.key}
            </span>
            {item.sub && <span className="text-xs text-brand-ink-soft">{item.sub}</span>}
          </button>
        )
      })}
    </div>
  )
}

function FortuneContent({
  date,
  selectedKey,
  content,
  emptyHint,
}: {
  date: string
  selectedKey: string | null
  content: string | undefined
  emptyHint: string
}) {
  if (!selectedKey) {
    return (
      <div className="mt-5 rounded-[10px] border border-dashed border-brand-line px-4 py-8 text-center text-sm text-brand-ink-soft">
        {emptyHint}
      </div>
    )
  }

  return (
    <div className="mt-5 rounded-[10px] border border-brand-line bg-brand-primary-light p-4">
      <p className="mb-1.5 text-xs font-semibold text-brand-primary-hover">{date} · {selectedKey}</p>
      {content ? (
        <p className="text-sm leading-relaxed text-brand-ink md:text-base">{content}</p>
      ) : (
        <p className="text-sm text-brand-ink-soft">오늘의 운세를 준비 중입니다. 잠시 후 다시 확인해주세요.</p>
      )}
    </div>
  )
}
