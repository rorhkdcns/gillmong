// 페이지 이동 중 즉시 보이는 화면. 서버 응답을 기다리는 동안 빈 화면 대신 골격을 보여줘서 "눌렸다"는 반응을 바로 준다.
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="min-h-[60vh] bg-brand-page">
      <div className="h-1 w-full overflow-hidden bg-brand-primary-light">
        <div className="h-full w-1/3 animate-[gm-bar_1s_ease-in-out_infinite] bg-brand-primary" />
      </div>
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10">
        <div className="h-8 w-1/3 animate-pulse rounded-[3px] bg-brand-line" />
        <div className="h-4 w-2/3 animate-pulse rounded-[3px] bg-brand-line" />
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-[4px] bg-brand-line/70" />
          ))}
        </div>
      </div>
    </div>
  )
}
