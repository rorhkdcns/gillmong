'use client'

import { useCallback, useState } from 'react'

/** 목록에서 체크한 항목 id를 관리한다. */
export function useBulkSelect<T extends string | number>() {
  const [selected, setSelected] = useState<Set<T>>(new Set())
  const toggle = useCallback((id: T) => {
    setSelected((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }, [])
  const setAll = useCallback((ids: T[], on: boolean) => setSelected(on ? new Set(ids) : new Set()), [])
  const clear = useCallback(() => setSelected(new Set()), [])
  return { selected, toggle, setAll, clear }
}

/** 표 머리의 전체 선택 체크박스 */
export function SelectAllBox({ ids, selected, setAll }: { ids: (string | number)[]; selected: Set<string | number>; setAll: (ids: (string | number)[], on: boolean) => void }) {
  const all = ids.length > 0 && ids.every((i) => selected.has(i))
  return (
    <input
      type="checkbox"
      aria-label="전체 선택"
      checked={all}
      onChange={(e) => setAll(ids, e.target.checked)}
      className="h-4 w-4 cursor-pointer accent-[#E5421F]"
    />
  )
}

export function RowBox({ id, selected, toggle }: { id: string | number; selected: Set<string | number>; toggle: (id: string | number) => void }) {
  return (
    <input
      type="checkbox"
      aria-label="선택"
      checked={selected.has(id)}
      onChange={() => toggle(id)}
      className="h-4 w-4 cursor-pointer accent-[#E5421F]"
    />
  )
}

/** 선택된 항목이 있을 때 나타나는 일괄 삭제 바 */
export function BulkBar({ count, onDelete, onClear, busy, noun = '항목' }: { count: number; onDelete: () => void; onClear: () => void; busy?: boolean; noun?: string }) {
  if (count === 0) return null
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-[#FFD3C4] bg-[#FFF1EA] px-4 py-2.5 text-sm sm:px-6">
      <strong className="text-[#231C17]">{count}개 선택됨</strong>
      <button type="button" disabled={busy} onClick={onDelete} className="rounded-[3px] bg-red-500 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-60">
        {busy ? '삭제 중...' : `선택한 ${noun} 삭제`}
      </button>
      <button type="button" onClick={onClear} className="text-xs text-[#6B605A] hover:underline">선택 해제</button>
    </div>
  )
}

/** 삭제 전 확인 */
export function confirmBulk(count: number, noun: string) {
  return window.confirm(`선택한 ${noun} ${count}개를 삭제할까요?\n삭제 후에는 복구할 수 없어요.`)
}
