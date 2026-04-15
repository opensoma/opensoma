import type { MetadataRoute } from 'next'

import { getRobotsRules, getSiteUrl, toAbsoluteUrl } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: getRobotsRules(),
    sitemap: toAbsoluteUrl('/sitemap.xml'),
    host: getSiteUrl().origin,
  }
}
