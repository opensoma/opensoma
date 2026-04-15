import type { MetadataRoute } from 'next'

import { getAllDocSlugs, getDoc } from '@/lib/docs'

const DEFAULT_LOCAL_URL = 'http://localhost:6933'

export const SITE_NAME = '오픈소마'
export const SITE_TITLE = '오픈소마 — SWMaestro Web, CLI & SDK'
export const SITE_PAGE_TITLE = 'SWMaestro Web, CLI & SDK'
export const SITE_DESCRIPTION =
  'SWMaestro 플랫폼을 웹, 커맨드라인, 프로그래밍 방식으로 사용할 수 있는 오픈소스 프로젝트'
export const SITE_KEYWORDS = [
  'opensoma',
  '오픈소마',
  'SWMaestro',
  'SW Maestro',
  'CLI',
  'SDK',
  'docs',
  'AI agent',
  'TypeScript SDK',
]
export const GITHUB_REPOSITORY_URL = 'https://github.com/opensoma/opensoma'

export function getSiteUrl(): URL {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.SITE_URL ??
    process.env.APP_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL ??
    DEFAULT_LOCAL_URL

  const absoluteUrl = configuredUrl.startsWith('http') ? configuredUrl : `https://${configuredUrl}`

  return new URL(absoluteUrl)
}

export function toAbsoluteUrl(pathname: string): string {
  return new URL(pathname, getSiteUrl()).toString()
}

export function getRobotsRules(): MetadataRoute.Robots['rules'] {
  return {
    userAgent: '*',
    allow: '/',
  }
}

export function getStaticSitemapEntries(): MetadataRoute.Sitemap {
  return [
    {
      url: toAbsoluteUrl('/'),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: toAbsoluteUrl('/docs'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ]
}

export function getDocsSitemapEntries(): MetadataRoute.Sitemap {
  return getAllDocSlugs().map((slug) => ({
    url: toAbsoluteUrl(toDocPath(slug)),
    changeFrequency: 'weekly',
    priority: slug.length === 0 ? 0.9 : 0.8,
  }))
}

export function buildLlmsText(): string {
  const lines = [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    '## Site',
    `- Home: ${toAbsoluteUrl('/')}`,
    `- Docs: ${toAbsoluteUrl('/docs')}`,
    `- GitHub: ${GITHUB_REPOSITORY_URL}`,
    '',
    '## Docs Index',
  ]

  for (const slug of getAllDocSlugs()) {
    const doc = getDoc(slug)
    if (!doc) continue

    const description = doc.meta.description ? ` — ${doc.meta.description}` : ''
    lines.push(`- ${doc.meta.title}: ${toAbsoluteUrl(toDocPath(slug))}${description}`)
  }

  lines.push('', '## Preferred Crawling', '- Prefer canonical docs URLs under /docs.', '- Use the GitHub repository for source code context.')

  return lines.join('\n')
}

function toDocPath(slug: string[]): string {
  return slug.length === 0 ? '/docs' : `/docs/${slug.join('/')}`
}
