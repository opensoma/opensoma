import { ArrowRight, Browser, Command, Package, SignIn, Terminal } from '@phosphor-icons/react/dist/ssr'
import type { Metadata } from 'next'

import { JsonLdScript } from '@/components/json-ld-script'
import {
  GITHUB_REPOSITORY_URL,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_PAGE_TITLE,
  SITE_TITLE,
  getSiteUrl,
} from '@/lib/seo'
import Link from '@/ui/link'

export const metadata: Metadata = {
  title: SITE_PAGE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: '/',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: '오픈소마',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
}

export default function LandingPage() {
  const siteUrl = getSiteUrl()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}#website`,
        url: siteUrl,
        name: '오픈소마',
        description: SITE_DESCRIPTION,
        inLanguage: 'ko-KR',
      },
      {
        '@type': 'SoftwareApplication',
        name: 'opensoma',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'macOS, Linux, Windows',
        description: SITE_DESCRIPTION,
        url: siteUrl,
        sameAs: [GITHUB_REPOSITORY_URL],
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
    ],
  }

  return (
    <div className="flex flex-1 flex-col">
      <JsonLdScript data={jsonLd} />
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          SWMaestro
          <br />
          <span className="text-primary">Web, CLI & SDK</span>
        </h1>
        <p className="mt-6 max-w-lg text-lg text-foreground-muted">
          멘토링, 회의실 예약, 공지사항 등 SWMaestro 기능을 웹, 터미널, 코드에서 모두 사용할 수 있습니다.
        </p>
        <div className="mt-4 text-sm text-foreground-muted">
          AI 에이전트가 SWMaestro 플랫폼과 상호작용할 수 있도록 설계되었습니다.
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            <SignIn size={16} />
            오픈소마 로그인하기
          </Link>
          <Link
            href="/docs"
            className="flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            CLI&SDK 시작하기
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="border-t border-border bg-muted/30 px-4 py-20">
        <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={Browser}
            title="Web"
            description="대시보드, 멘토링, 회의실 예약 등 SWMaestro 기능을 웹에서 바로 사용합니다."
          />
          <FeatureCard
            icon={Terminal}
            title="CLI"
            description="멘토링 생성, 회의실 예약, 공지사항 조회 등 모든 작업을 터미널에서 수행합니다."
          />
          <FeatureCard
            icon={Package}
            title="SDK"
            description="TypeScript SDK로 SWMaestro 기능에 프로그래밍 방식으로 접근합니다."
          />
          <FeatureCard
            icon={Command}
            title="AI Agent"
            description="Agent Skills로 AI 에이전트가 SWMaestro 플랫폼과 직접 상호작용합니다."
          />
        </div>
      </section>

      <footer className="border-t border-border px-4 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between text-xs text-foreground-muted">
          <span>MIT License</span>
          <a
            href="https://github.com/opensoma/opensoma"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Terminal
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light">
        <Icon size={20} className="text-primary" />
      </div>
      <h3 className="mb-2 text-base font-bold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-foreground-muted">{description}</p>
    </div>
  )
}
