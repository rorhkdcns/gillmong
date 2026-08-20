import { NextRequest, NextResponse } from 'next/server'
import { pickShopCollectionTargets, runShopProductGeneration } from '@/lib/shopProductGeneration'

// Hobby 요금제는 cron을 하루 1번만 돌릴 수 있어, 그 한 번에 여러 건을 처리한다.
// 60초 제한 안에서 안전하게 끝나는 선에서 최대한 처리량을 확보.
export const maxDuration = 60

const TARGET_COUNT = 8
const DELAY_MS = 1500 // 쿠팡 API 호출량 제한 회피용 딜레이

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// GET /api/cron/shop-collect
// Vercel Cron이 하루 1번(KST 09:30) 호출
// 수집 이력이 오래된 카테고리/하위카테고리 순으로 8개를 골라 순차적으로 쿠팡 검색 → 신규 상품 저장
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  const targets = await pickShopCollectionTargets(TARGET_COUNT)
  if (targets.length === 0) {
    return NextResponse.json({ processed: 0, newProducts: 0, failed: 0, message: '대상 없음' })
  }

  let processed = 0
  let newProducts = 0
  let failed = 0

  for (const target of targets) {
    if (processed > 0) await sleep(DELAY_MS)
    processed++

    const result = await runShopProductGeneration(target.categoryId, target.subcategoryId)
    if (result.error) {
      console.error('[ShopCollect] 수집 실패, 다음 대상으로 계속:', target, result.error)
      failed++
      continue
    }
    newProducts += result.newCount ?? 0
  }

  console.log(`[ShopCollect] 완료: ${processed}건 처리, ${newProducts}개 신규 상품, ${failed}건 실패`)
  return NextResponse.json({ processed, newProducts, failed })
}
