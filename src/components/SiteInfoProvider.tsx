'use client'

import { createContext, useContext } from 'react'
import { SITE_INFO } from '@/lib/siteConfig'
import type { SiteInfo } from '@/lib/siteSettings'

const Ctx = createContext<SiteInfo>({ ...SITE_INFO })

export function SiteInfoProvider({ info, children }: { info: SiteInfo; children: React.ReactNode }) {
  return <Ctx.Provider value={info}>{children}</Ctx.Provider>
}
export const useSiteInfo = () => useContext(Ctx)
