import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { SITE_INFO } from '@/lib/siteConfig'

export type SiteInfo = { -readonly [K in keyof typeof SITE_INFO]: string } & { privacyOfficer?: string }

export const SITE_INFO_LABELS: Record<keyof SiteInfo, string> = {
  companyName: '상호명',
  ceo: '대표자',
  businessNumber: '사업자등록번호',
  mailOrderNumber: '통신판매업 신고번호',
  address: '주소',
  phone: '대표 전화번호',
  email: '대표 이메일',
  hours: '운영시간',
  lunch: '점심시간',
  privacyOfficer: '개인정보 보호책임자',
}

/** DB(site_settings.key='site_info')에 저장된 값을 기본값 위에 덮어서 돌려준다. 테이블이 없거나 실패하면 기본값. */
export const getSiteInfo = unstable_cache(
  async (): Promise<SiteInfo> => {
    try {
      const admin = createAdminClient()
      const { data } = await admin.from('site_settings').select('value').eq('key', 'site_info').maybeSingle()
      const saved = (data?.value ?? {}) as Partial<SiteInfo>
      const merged: SiteInfo = { ...SITE_INFO }
      for (const k of Object.keys(SITE_INFO_LABELS) as (keyof SiteInfo)[]) {
        const v = saved[k]
        if (typeof v === 'string') (merged as Record<string, string>)[k] = v.trim()
      }
      return merged
    } catch {
      return { ...SITE_INFO }
    }
  },
  ['site-info'],
  { tags: ['site-settings'], revalidate: 3600 },
)
