// Naver의 실제 userinfo 엔드포인트(https://openapi.naver.com/v1/nid/me)는
// 응답을 { resultcode, message, response: { id, email, name, ... } } 형태로
// 한 겹 감싸서 반환한다. Supabase Auth의 custom OAuth2 provider는 userinfo
// 응답이 최상위(top-level)에 sub/email 같은 평면 클레임으로 오는 것을
// 기대하므로, 감싸진 그대로 넘기면 사용자 정보를 못 읽고 로그인이 실패한다
// (동의 화면 이후 로그인 페이지로 되돌아가는 증상의 원인).
//
// 이 함수를 Supabase 프로젝트의 naver custom provider 설정에서
// UserInfo URL로 등록하면, Naver 응답을 평면 구조로 펼쳐서 돌려준다.
//
// 배포 시 반드시 --no-verify-jwt 로 배포해야 한다:
//   supabase functions deploy naver-userinfo --no-verify-jwt --use-api
// GoTrue가 이 엔드포인트를 호출할 때 Authorization 헤더에 넣는 건
// Supabase JWT가 아니라 Naver access_token이라, 기본 JWT 검증을 켜두면
// 이 함수 코드가 실행되기도 전에 Supabase 게이트웨이가 401로 막아버린다.

Deno.serve(async (req: Request) => {
  const authHeader = req.headers.get('authorization')

  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'missing_authorization_header' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })
  }

  const naverRes = await fetch('https://openapi.naver.com/v1/nid/me', {
    headers: { authorization: authHeader },
  })

  if (!naverRes.ok) {
    return new Response(
      JSON.stringify({ error: 'naver_userinfo_request_failed', status: naverRes.status }),
      { status: 502, headers: { 'content-type': 'application/json' } }
    )
  }

  const body = await naverRes.json()
  const profile = body?.response

  if (body?.resultcode !== '00' || !profile?.id) {
    return new Response(JSON.stringify({ error: 'naver_userinfo_invalid_response', body }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    })
  }

  const flattened = {
    sub: profile.id,
    email: profile.email,
    email_verified: Boolean(profile.email),
    name: profile.name ?? profile.nickname,
    nickname: profile.nickname,
    preferred_username: profile.nickname,
    picture: profile.profile_image,
  }

  return new Response(JSON.stringify(flattened), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
})
