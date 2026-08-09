import type { DictionaryBodyBlock } from '@/lib/dictionaryBody'
import type { CategoryColorSet } from '@/lib/categoryColor'

// 해몽 사전 페이지(대분류/상세) 공용 블록 스타일 (전역 --color-brand-page는 건드리지 않음)
export const BLOCK_SHAPE = 'rounded-[14px] shadow-[0_1px_3px_rgba(11,36,51,0.06)] p-[20px_18px] md:p-[26px_24px]'

export default function DictionaryBodyBlocks({
  blocks,
  colors,
}: {
  blocks: DictionaryBodyBlock[]
  colors: CategoryColorSet
}) {
  return (
    <>
      {blocks.map((block, i) => {
        const isWarning = block.variant === 'warning'
        return (
          <div
            key={i}
            className={`${BLOCK_SHAPE} ${isWarning ? '' : 'bg-white'}`}
            style={isWarning ? { backgroundColor: '#FDF6E8' } : undefined}
          >
            {block.title && (
              <h2 className={`mb-4 text-2xl font-medium ${isWarning ? 'text-brand-warning-text' : 'text-brand-ink'}`}>
                {block.title}
              </h2>
            )}
            <div className="flex flex-col gap-4">
              {block.children.map((child, j) =>
                child.type === 'paragraph' ? (
                  <p
                    key={j}
                    className={`whitespace-pre-line text-lg leading-[1.95] ${isWarning ? 'text-brand-warning-text' : 'text-brand-ink'}`}
                  >
                    {child.text}
                  </p>
                ) : (
                  <div key={j} className="flex flex-col gap-[12px]">
                    {child.items.map((item, k) => (
                      <div key={k} className="overflow-hidden rounded-[10px] border border-[#DCE5EB]">
                        <div
                          className="p-[13px_18px] text-lg font-medium"
                          style={{ backgroundColor: colors.badgeBg, color: colors.badgeText }}
                        >
                          {item.label}
                        </div>
                        {item.description && (
                          <div className="bg-white p-[16px_18px] text-lg leading-[1.85] text-brand-ink">
                            {item.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        )
      })}
    </>
  )
}
