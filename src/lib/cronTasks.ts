import { createAdminClient } from '@/lib/supabase/admin'
import { searchProducts } from '@/lib/coupang'
import { pickShopCollectionTargets, runShopProductGeneration } from '@/lib/shopProductGeneration'
import { ZODIAC_KEYS, STAR_KEYS, getKSTDateString, type FortuneType } from '@/lib/fortune'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// confirm_deadline이 지난 paid_escrow 주문을 자동 settled 처리
export async function runAutoSettle() {
  const admin = createAdminClient()

  const { data: overdueOrders, error } = await admin
    .from('orders')
    .select('id, seller_id, seller_amount')
    .eq('status', 'paid_escrow')
    .lt('confirm_deadline', new Date().toISOString())

  if (error) {
    console.error('[AutoSettle] 조회 오류:', error.message)
    return { error: error.message }
  }

  if (!overdueOrders || overdueOrders.length === 0) {
    return { settled: 0, message: '대상 없음' }
  }

  const now = new Date().toISOString()
  let settled = 0

  for (const order of overdueOrders) {
    try {
      const { data: sellerProfile } = await admin
        .from('profiles')
        .select('points')
        .eq('id', order.seller_id)
        .single()

      await Promise.all([
        admin.from('orders').update({
          status:     'settled',
          settled_at: now,
          updated_at: now,
        }).eq('id', order.id),
        ...(sellerProfile ? [
          admin.from('profiles')
            .update({ points: sellerProfile.points + order.seller_amount })
            .eq('id', order.seller_id),
          admin.from('point_logs').insert({
            user_id:     order.seller_id,
            amount:      order.seller_amount,
            type:        'earn',
            description: `꿈 판매 자동정산 (주문 ${order.id.substring(0, 8)}...)`,
          }),
        ] : []),
      ])
      settled++
    } catch (e) {
      console.error('[AutoSettle] 주문 처리 오류:', order.id, e)
    }
  }

  console.log(`[AutoSettle] 완료: ${settled}건 정산`)
  return { settled, total: overdueOrders.length }
}

const AFFILIATE_BATCH_SIZE = 50
const AFFILIATE_DELAY_MS = 300 // 쿠팡 API 호출량 제한 회피용 딜레이

// 활성 제휴상품을 오래된 순으로 재조회해 품절/판매중지 상품을 자동 비활성화
export async function runAffiliateHealth() {
  const admin = createAdminClient()

  const { data: targets, error } = await admin
    .from('affiliate_products')
    .select('id, title, price_text, product_id')
    .eq('is_active', true)
    .not('product_id', 'is', null)
    .order('last_checked_at', { ascending: true, nullsFirst: true })
    .limit(AFFILIATE_BATCH_SIZE)

  if (error) {
    console.error('[AffiliateHealth] 조회 오류:', error.message)
    return { error: error.message }
  }

  if (!targets || targets.length === 0) {
    return { checked: 0, deactivated: 0, message: '대상 없음' }
  }

  const now = new Date().toISOString()
  let checked = 0
  let deactivated = 0

  for (const product of targets) {
    if (checked > 0) await sleep(AFFILIATE_DELAY_MS)
    checked++

    const result = await searchProducts(product.title, 20)
    if (!result.ok) {
      console.error('[AffiliateHealth] 검색 실패, 다음 회차에 재시도:', product.id, result.error)
      continue
    }

    const match = result.data.find((p) => String(p.productId) === product.product_id)

    if (!match) {
      await admin.from('affiliate_products').update({
        is_active: false,
        deactivated_reason: '검색 결과에서 확인되지 않음 (품절/판매중지 추정)',
        deactivated_at: now,
        last_checked_at: now,
      }).eq('id', product.id)
      deactivated++
      continue
    }

    const updates: { last_checked_at: string; price_text?: string } = { last_checked_at: now }
    const newPriceText = `${match.productPrice.toLocaleString()}원`
    if (newPriceText !== product.price_text) updates.price_text = newPriceText
    await admin.from('affiliate_products').update(updates).eq('id', product.id)
  }

  console.log(`[AffiliateHealth] 완료: ${checked}건 확인, ${deactivated}건 비활성화`)
  return { checked, deactivated, total: targets.length }
}

const SHOP_COLLECT_TARGET_COUNT = 8
const SHOP_COLLECT_DELAY_MS = 1500 // 쿠팡 API 호출량 제한 회피용 딜레이

// 수집 이력이 오래된 카테고리/하위카테고리 순으로 몇 개를 골라 순차적으로 쿠팡 검색 → 신규 상품 저장
export async function runShopCollect() {
  const targets = await pickShopCollectionTargets(SHOP_COLLECT_TARGET_COUNT)
  if (targets.length === 0) {
    return { processed: 0, newProducts: 0, failed: 0, message: '대상 없음' }
  }

  let processed = 0
  let newProducts = 0
  let failed = 0

  for (const target of targets) {
    if (processed > 0) await sleep(SHOP_COLLECT_DELAY_MS)
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
  return { processed, newProducts, failed }
}

const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const FORTUNE_PROMPTS: Record<FortuneType, string> = {
  zodiac: `아래 12간지 띠 각각에 대해 오늘 하루의 운세를 2~3문장으로 써줘. 밝고 희망적인 톤으로, 뻔하지 않게 각 띠마다 다르게.

쥐, 소, 호랑이, 토끼, 용, 뱀, 말, 양, 원숭이, 닭, 개, 돼지

출력 형식 — 반드시 이 형식 그대로, 다른 설명 없이:
쥐: (운세 내용)
소: (운세 내용)
호랑이: (운세 내용)
토끼: (운세 내용)
용: (운세 내용)
뱀: (운세 내용)
말: (운세 내용)
양: (운세 내용)
원숭이: (운세 내용)
닭: (운세 내용)
개: (운세 내용)
돼지: (운세 내용)`,
  star: `아래 12별자리 각각에 대해 오늘 하루의 운세를 2~3문장으로 써줘. 밝고 희망적인 톤으로, 뻔하지 않게 각 별자리마다 다르게.

양자리, 황소자리, 쌍둥이자리, 게자리, 사자자리, 처녀자리, 천칭자리, 전갈자리, 사수자리, 염소자리, 물병자리, 물고기자리

출력 형식 — 반드시 이 형식 그대로, 다른 설명 없이:
양자리: (운세 내용)
황소자리: (운세 내용)
쌍둥이자리: (운세 내용)
게자리: (운세 내용)
사자자리: (운세 내용)
처녀자리: (운세 내용)
천칭자리: (운세 내용)
전갈자리: (운세 내용)
사수자리: (운세 내용)
염소자리: (운세 내용)
물병자리: (운세 내용)
물고기자리: (운세 내용)`,
}

const FORTUNE_EXPECTED_KEYS: Record<FortuneType, string[]> = {
  zodiac: ZODIAC_KEYS,
  star: STAR_KEYS,
}

/** "이름: 내용" 형식의 줄들을 파싱한다. 12개가 정확히 기대한 key와 일치하지 않으면 null. */
function parseFortuneLines(raw: string, type: FortuneType): Map<string, string> | null {
  const expected = new Set(FORTUNE_EXPECTED_KEYS[type])
  const result = new Map<string, string>()

  for (const line of raw.split('\n')) {
    const match = line.match(/^\s*([^:：]+?)\s*[:：]\s*(.+?)\s*$/)
    if (!match) continue
    const [, key, content] = match
    if (expected.has(key) && content) result.set(key, content)
  }

  if (result.size !== expected.size) return null
  for (const key of expected) {
    if (!result.has(key)) return null
  }
  return result
}

async function callGemini(apiKey: string, prompt: string): Promise<string | null> {
  let res: Response | null = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9 },
      }),
    })
    if (res.ok || (res.status !== 503 && res.status !== 529)) break
    if (attempt < 3) await new Promise((r) => setTimeout(r, 1000))
  }

  if (!res || !res.ok) {
    const errText = await res?.text()
    console.error(`[DailyFortune] Gemini API 오류 status=${res?.status}`, errText)
    return null
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null
}

// 오늘치(KST) 띠/별자리 운세가 아직 없으면 Gemini 호출로 12개씩 채워넣는다.
export async function runDailyFortune() {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY
  if (!GEMINI_API_KEY) {
    return { error: 'GEMINI_API_KEY가 설정되지 않았습니다.' }
  }

  const admin = createAdminClient()
  const today = getKSTDateString()
  const results: Record<FortuneType, 'skipped' | 'created' | 'failed'> = {
    zodiac: 'skipped',
    star: 'skipped',
  }

  for (const type of ['zodiac', 'star'] as FortuneType[]) {
    const { count } = await admin
      .from('daily_fortunes')
      .select('id', { count: 'exact', head: true })
      .eq('fortune_date', today)
      .eq('type', type)

    if ((count ?? 0) >= FORTUNE_EXPECTED_KEYS[type].length) continue // 이미 오늘치 있음 — 스킵

    const raw = await callGemini(GEMINI_API_KEY, FORTUNE_PROMPTS[type])
    if (!raw) {
      results[type] = 'failed'
      continue
    }

    const parsed = parseFortuneLines(raw, type)
    if (!parsed) {
      console.error(`[DailyFortune] 파싱 실패 (type=${type}), 응답:`, raw)
      results[type] = 'failed'
      continue
    }

    const rows = [...parsed.entries()].map(([key, content]) => ({
      fortune_date: today,
      type,
      key,
      content,
    }))

    const { error } = await admin.from('daily_fortunes').upsert(rows, { onConflict: 'fortune_date,type,key' })
    if (error) {
      console.error(`[DailyFortune] 저장 실패 (type=${type}):`, error.message)
      results[type] = 'failed'
      continue
    }

    results[type] = 'created'
  }

  console.log(`[DailyFortune] 완료 (${today}):`, results)
  return { date: today, results }
}
