import { notFound } from 'next/navigation'

import { Breadcrumb } from '~/components/breadcrumb'
import { HtmlContent } from '~/components/html-content'
import { requireAuth } from '~/lib/auth'
import { Card, CardContent, CardHeader } from '~/ui/card'

interface EventDetail {
  id: number
  title: string
  content: string
  fields: Record<string, unknown>
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const eventId = Number(id)

  if (Number.isNaN(eventId)) {
    notFound()
  }

  const client = await requireAuth()
  const detail = normalizeEventDetail(await client.event.get(eventId))

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: '행사 게시판', href: '/event' },
          { label: detail.title || '행사 상세' },
        ]}
      />
      <Card>
        <CardHeader>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">{detail.title || '행사 상세'}</h1>
            <p className="text-sm text-foreground-muted">행사 상세 정보를 확인하세요.</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <dl className="grid gap-4 md:grid-cols-2">
            {Object.entries(detail.fields)
              .filter(([key]) => !['제목', 'content', 'NO', '번호'].includes(key))
              .map(([key, value]) => (
                <div key={key} className="rounded-lg bg-muted p-4">
                  <dt className="text-sm text-foreground-muted">{key}</dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">{String(value || '-')}</dd>
                </div>
              ))}
          </dl>
          <HtmlContent content={detail.content} />
        </CardContent>
      </Card>
    </div>
  )
}

function normalizeEventDetail(detail: unknown): EventDetail {
  if (typeof detail === 'object' && detail !== null && 'title' in detail && 'content' in detail && 'fields' in detail) {
    const record = detail as Record<string, unknown>

    return {
      id: Number(record.id ?? 0),
      title: String(record.title ?? ''),
      content: String(record.content ?? ''),
      fields: (record.fields as Record<string, unknown>) ?? {},
    }
  }

  return { id: 0, title: '행사 상세', content: '', fields: {} }
}
