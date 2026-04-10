import { notFound } from 'next/navigation'

import { Breadcrumb } from '~/components/breadcrumb'
import { HtmlContent } from '~/components/html-content'
import { StatusBadge } from '~/components/status-badge'
import { requireAuth } from '~/lib/auth'
import { Card, CardContent, CardHeader } from '~/ui/card'
import { Separator } from '~/ui/separator'

export default async function MentoringDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const mentoringId = Number(id)

  if (Number.isNaN(mentoringId)) {
    notFound()
  }

  const client = await requireAuth()
  const mentoring = await client.mentoring.get(mentoringId)

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: '멘토링 / 특강 게시판', href: '/mentoring' },
          { label: mentoring.title },
        ]}
      />
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={mentoring.status} />
              <span className="text-sm text-foreground-muted">{mentoring.type}</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">{mentoring.title}</h1>
              <p className="text-sm text-foreground-muted">
                {mentoring.sessionDate} · {mentoring.sessionTime.start} ~ {mentoring.sessionTime.end}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetaItem label="장소" value={mentoring.venue || '-'} />
            <MetaItem
              label="접수 기간"
              value={`${mentoring.registrationPeriod.start} ~ ${mentoring.registrationPeriod.end}`}
            />
            <MetaItem label="참여 인원" value={`${mentoring.attendees.current} / ${mentoring.attendees.max}`} />
            <MetaItem label="작성자" value={mentoring.author} />
            <MetaItem label="등록일" value={mentoring.createdAt} />
            <MetaItem label="개설 승인" value={mentoring.approved ? '승인완료' : '대기'} />
          </div>
          <Separator />
          <HtmlContent content={mentoring.content} />
        </CardContent>
      </Card>
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted p-4">
      <p className="text-sm text-foreground-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}
