// 쿠팡파트너스 Open API 클라이언트 (서버 전용 — COUPANG_SECRET_KEY를 다루므로 절대 클라이언트에서 import 금지).
//
// ★ 이 파일의 함수는 어드민이 상품을 "미리 조회해서 DB에 저장"하는 용도로만 쓴다.
//   사전 상세 페이지 등 공개 페이지 렌더링 시점에는 이 파일을 절대 호출하지 않는다
//   (페이지는 affiliate_products 테이블만 읽는다).
//
// HMAC 서명 방식은 쿠팡 공식 문서(developers.coupang.com "Creating HMAC Signature")와
// 실제 동작하는 커뮤니티 SDK 구현체 두 곳을 교차 검증해 맞춘 것 — 아래를 임의로 바꾸지 말 것:
//   - message = signedDate + method + path + query  (물음표 "?"는 포함하지 않음)
//   - signedDate 포맷: yyMMddTHHmmssZ (UTC, "Z"는 리터럴 문자)
//   - Authorization: "CEA algorithm=HmacSHA256, access-key={accessKey}, signed-date={signedDate}, signature={signature}"
//   - 상품검색: GET /v2/providers/affiliate_open_api/apis/openapi/products/search (v1 세그먼트 없음)
//   - 딥링크 변환: POST /v2/providers/affiliate_open_api/apis/openapi/v1/deeplink (v1 세그먼트 있음)

import crypto from 'crypto'

const BASE_URL = 'https://api-gateway.coupang.com'
const SEARCH_PATH = '/v2/providers/affiliate_open_api/apis/openapi/products/search'
const DEEPLINK_PATH = '/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink'

export interface CoupangProduct {
  productId: number
  productName: string
  productPrice: number
  productImage: string
  productUrl: string
  isRocket: boolean
  isFreeShipping: boolean
}

export interface CoupangDeeplink {
  originalUrl: string
  shortenUrl: string
  landingUrl: string
}

export type CoupangResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** yyMMddTHHmmssZ (UTC) */
function signedDateNow(): string {
  const now = new Date()
  const yy = String(now.getUTCFullYear()).slice(-2)
  const mm = pad2(now.getUTCMonth() + 1)
  const dd = pad2(now.getUTCDate())
  const HH = pad2(now.getUTCHours())
  const MM = pad2(now.getUTCMinutes())
  const SS = pad2(now.getUTCSeconds())
  return `${yy}${mm}${dd}T${HH}${MM}${SS}Z`
}

function buildAuthorizationHeader(method: string, pathWithQuery: string, accessKey: string, secretKey: string): string {
  const [path, query = ''] = pathWithQuery.split('?')
  const signedDate = signedDateNow()
  const message = signedDate + method.toUpperCase() + path + query
  const signature = crypto.createHmac('sha256', secretKey).update(message).digest('hex')
  return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${signedDate}, signature=${signature}`
}

function getCredentials(): { ok: true; accessKey: string; secretKey: string } | { ok: false; error: string } {
  const accessKey = process.env.COUPANG_ACCESS_KEY
  const secretKey = process.env.COUPANG_SECRET_KEY
  if (!accessKey || !secretKey) {
    return { ok: false, error: 'COUPANG_ACCESS_KEY/COUPANG_SECRET_KEY 환경변수가 설정되지 않았습니다.' }
  }
  return { ok: true, accessKey, secretKey }
}

async function coupangRequest<T>(
  method: 'GET' | 'POST',
  path: string,
  options: { query?: Record<string, string | number | boolean | undefined>; body?: unknown } = {},
): Promise<CoupangResult<T>> {
  const creds = getCredentials()
  if (!creds.ok) return creds

  try {
    const url = new URL(path, BASE_URL)
    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined && value !== '') url.searchParams.set(key, String(value))
      }
    }
    const pathWithQuery = url.pathname + url.search
    const authorization = buildAuthorizationHeader(method, pathWithQuery, creds.accessKey, creds.secretKey)

    const res = await fetch(url.toString(), {
      method,
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json;charset=UTF-8',
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    })

    const text = await res.text()

    if (!res.ok) {
      return { ok: false, error: `쿠팡 API 오류 (HTTP ${res.status}): ${text.slice(0, 300)}` }
    }

    let json: { rCode?: string; rMessage?: string; data?: T }
    try {
      json = JSON.parse(text)
    } catch {
      return { ok: false, error: '쿠팡 API 응답을 파싱하지 못했습니다.' }
    }

    if (json.rCode && json.rCode !== '0') {
      return { ok: false, error: json.rMessage || `쿠팡 API 오류 (rCode: ${json.rCode})` }
    }

    return { ok: true, data: json.data as T }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : '쿠팡 API 요청 중 알 수 없는 오류가 발생했습니다.' }
  }
}

export async function searchProducts(keyword: string, limit = 20): Promise<CoupangResult<CoupangProduct[]>> {
  if (!keyword.trim()) return { ok: false, error: '검색어를 입력해주세요.' }

  const result = await coupangRequest<{ landingUrl: string; productData: CoupangProduct[] }>('GET', SEARCH_PATH, {
    query: { keyword: keyword.trim(), limit, imageSize: '230x230' },
  })
  if (!result.ok) return result
  return { ok: true, data: result.data?.productData ?? [] }
}

export async function createDeeplink(urls: string[]): Promise<CoupangResult<CoupangDeeplink[]>> {
  if (urls.length === 0) return { ok: false, error: '변환할 URL이 없습니다.' }

  const result = await coupangRequest<CoupangDeeplink[]>('POST', DEEPLINK_PATH, {
    body: { coupangUrls: urls },
  })
  if (!result.ok) return result
  return { ok: true, data: result.data ?? [] }
}
