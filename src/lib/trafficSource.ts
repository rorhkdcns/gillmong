// 방문 기록용: referrer / utm 에서 유입 경로(source)와 검색어(keyword)를 뽑는다.
const HOSTS: Array<[RegExp, string, string]> = [
  [/(^|\.)naver\.com$/, '네이버', '검색'],
  [/(^|\.)google\./, '구글', '검색'],
  [/(^|\.)daum\.net$|(^|\.)kakao\.com$/, '다음/카카오', '검색'],
  [/(^|\.)bing\.com$/, '빙', '검색'],
  [/(^|\.)zum\.com$/, '줌', '검색'],
  [/(^|\.)instagram\.com$|(^|\.)l\.instagram\.com$/, '인스타그램', 'SNS'],
  [/(^|\.)threads\.(net|com)$/, '스레드', 'SNS'],
  [/(^|\.)facebook\.com$|(^|\.)fb\.com$/, '페이스북', 'SNS'],
  [/(^|\.)youtube\.com$|(^|\.)youtu\.be$/, '유튜브', 'SNS'],
  [/(^|\.)tiktok\.com$/, '틱톡', 'SNS'],
  [/(^|\.)t\.co$|(^|\.)twitter\.com$|(^|\.)x\.com$/, 'X(트위터)', 'SNS'],
]

export function classifyVisit(input: { path: string; search: string; referrer: string }) {
  const q = new URLSearchParams(input.search || '')
  let host = ''
  let ref: URL | null = null
  try { ref = input.referrer ? new URL(input.referrer) : null; host = ref?.hostname ?? '' } catch { /* ignore */ }
  if (host.endsWith('gillmong.com')) return null // 사이트 내부 이동은 기록하지 않음

  const utmSource = q.get('utm_source')
  let source = '직접 유입'
  let medium = '직접'
  if (utmSource) {
    source = utmSource.slice(0, 40)
    medium = q.get('utm_medium') ? q.get('utm_medium')!.slice(0, 20) : '광고'
  } else if (host) {
    const hit = HOSTS.find(([re]) => re.test(host))
    if (hit) { source = hit[1]; medium = hit[2] } else { source = host.replace(/^www\./, '').slice(0, 60); medium = '기타' }
  }

  let keyword = q.get('utm_term')
  if (!keyword && ref) {
    keyword = ref.searchParams.get('query') ?? ref.searchParams.get('q') ?? ref.searchParams.get('p') ?? ref.searchParams.get('keyword')
  }
  return {
    landing_path: input.path.slice(0, 200),
    source,
    medium,
    keyword: keyword ? keyword.trim().slice(0, 80) : null,
    referrer_host: host ? host.slice(0, 100) : null,
    campaign: q.get('utm_campaign')?.slice(0, 60) ?? null,
  }
}
