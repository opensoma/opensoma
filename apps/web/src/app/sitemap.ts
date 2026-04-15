import type { MetadataRoute } from 'next'

import { getDocsSitemapEntries, getStaticSitemapEntries } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  return [...getStaticSitemapEntries(), ...getDocsSitemapEntries()]
}
