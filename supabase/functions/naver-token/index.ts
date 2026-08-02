// 네이버 토큰 엔드포인트(https://nid.naver.com/oauth2.0/token)는 RFC 6749
// 표준과 다르게 인가코드 교환(token exchange) 요청에도 state 파라미터를
// 필수로 요구한다. Supabase Auth의 custom OAuth2 client는 RFC 6749를
// 그대로 따르기 때문에 token 요청에 state를 넣지 않고, 그 결과 네이버가
// 요청을 거부해 "Unable to exchange external code"(unexpected_failure)로
// 이어진다.
//
// 이 함수를 naver custom provider 설정의 Token URL로 등록하면, GoTrue가
// 보낸 표준 토큰 교환 요청을 그대로 받아 state를 채워 네이버 실제 토큰
// 엔드포인트로 전달하고, 응답을 그대로 돌려준다.
//
// 원래 authorize 단계에서 쓰인 state 값은 GoTrue가 내부에서만 관리해 이
// 함수에서는 알 수 없다. 우선 비어있지 않은 고정값을 채워 보내는 방식으로
// 시도한다 — 여러 네이버 로그인 구현 예제에서 state가 원 요청과의 일치
// 검증 없이 존재 여부만 확인되는 것으로 보이기 때문. 만약 실제로 값 일치
// 검증까지 한다면 authorize 단계도 함께 프록시해서 state를 직접 관리해야
// 한다 — 테스트 후에도 실패하면 이 부분부터 다시 봐야 함.
//
// 배포 시 반드시 --no-verify-jwt 로 배포해야 한다(naver-userinfo와 동일한
// 이유 — 이 호출은 Supabase JWT가 아니라 provider 자격증명으로 이루어짐):
//   supabase functions deploy naver-token --no-verify-jwt --use-api

const NAVER_TOKEN_URL = 'https://nid.naver.com/oauth2.0/token'

function decodeBasicAuth(header: string | null): { clientId?: string; clientSecret?: string } {
  if (!header?.startsWith('Basic ')) return {}
  try {
    const decoded = atob(header.slice('Basic '.length))
    const separatorIndex = decoded.indexOf(':')
    return {
      clientId: decoded.slice(0, separatorIndex),
      clientSecret: decoded.slice(separatorIndex + 1),
    }
  } catch {
    return {}
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    })
  }

  const contentType = req.headers.get('content-type') ?? ''
  let params: URLSearchParams

  if (contentType.includes('application/json')) {
    const body = await req.json()
    params = new URLSearchParams(body)
  } else {
    params = new URLSearchParams(await req.text())
  }

  const { clientId: basicClientId, clientSecret: basicClientSecret } = decodeBasicAuth(
    req.headers.get('authorization')
  )

  const forwardParams = new URLSearchParams()
  forwardParams.set('grant_type', params.get('grant_type') ?? 'authorization_code')
  forwardParams.set('code', params.get('code') ?? '')
  forwardParams.set('redirect_uri', params.get('redirect_uri') ?? '')
  forwardParams.set('client_id', params.get('client_id') ?? basicClientId ?? '')
  forwardParams.set('client_secret', params.get('client_secret') ?? basicClientSecret ?? '')
  forwardParams.set('state', params.get('state') || 'gillmong')

  // 자격증명 전체를 로그에 남기지 않도록 client_secret만 마스킹해서 찍는다.
  const loggedParams = new URLSearchParams(forwardParams)
  const secret = loggedParams.get('client_secret') ?? ''
  loggedParams.set(
    'client_secret',
    secret ? `${secret.slice(0, 2)}***${secret.slice(-2)} (len=${secret.length})` : '(empty)'
  )
  console.log('[naver-token] request params to nid.naver.com:', loggedParams.toString())

  const naverRes = await fetch(NAVER_TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: forwardParams.toString(),
  })

  const naverRawBody = await naverRes.text()
  console.log(
    '[naver-token] raw response from nid.naver.com:',
    naverRes.status,
    naverRes.headers.get('content-type'),
    naverRawBody
  )

  // 네이버 토큰 엔드포인트는 body가 JSON임에도 Content-Type을
  // text/plain;charset=UTF-8로 내려준다. GoTrue가 쓰는 Go oauth2
  // 라이브러리의 토큰 파서는 Content-Type에 "json"이 없으면 body를
  // form-urlencoded로 잘못 파싱해 access_token을 빈 값으로 읽는다 —
  // 이게 "Unable to exchange external code"의 실제 원인이다.
  // 여기서 JSON으로 재파싱한 뒤 항상 application/json으로 되돌려준다.
  // 겸사겸사 네이버가 expires_in을 문자열("3600")로 보내는 경우도
  // 숫자로 정규화한다(RFC 6749는 숫자를 요구).
  let responseBody = naverRawBody
  try {
    const parsed = JSON.parse(naverRawBody)
    if (typeof parsed.expires_in === 'string') {
      parsed.expires_in = Number(parsed.expires_in)
    }
    responseBody = JSON.stringify(parsed)
  } catch {
    // JSON이 아니면(에러 응답 등) 원본 그대로 전달
  }

  console.log('[naver-token] response returned to Supabase Auth:', naverRes.status, responseBody)

  return new Response(responseBody, {
    status: naverRes.status,
    headers: { 'content-type': 'application/json' },
  })
})
