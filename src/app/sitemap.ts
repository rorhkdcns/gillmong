import { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'

const SITE_URL = 'https://www.gillmong.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const admin = createAdminClient()

  const [{ data: dictEntries }, { data: dreams }, { data: categories }] = await Promise.all([
    admin
      .from('dictionary_entries')
      .select('slug, updated_at')
      .eq('is_published', true),
    admin
      .from('dreams')
      .select('id, created_at')
      .eq('is_adult', false),
    admin
      .from('categories')
      .select('slug')
      .eq('domain', 'dream')
      .eq('is_active', true),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/dictionary`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/guide`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/notice`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]

  const dictionaryPages: MetadataRoute.Sitemap = (dictEntries ?? []).map((entry) => ({
    url: `${SITE_URL}/dictionary/${entry.slug}`,
    lastModified: entry.updated_at ? new Date(entry.updated_at) : new Date(),
    changeFrequency: 'monthly',
    priority: 0.9,
  }))

  const dreamPages: MetadataRoute.Sitemap = (dreams ?? []).map((dream) => ({
    url: `${SITE_URL}/dream/${dream.id}`,
    lastModified: dream.created_at ? new Date(dream.created_at) : new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  const categoryPages: MetadataRoute.Sitemap = (categories ?? []).map((category) => ({
    url: `${SITE_URL}/category/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.7,
  }))

  return [...staticPages, ...dictionaryPages, ...dreamPages, ...categoryPages]
}
