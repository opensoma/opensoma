import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import { Breadcrumb } from '@/components/breadcrumb'
import { HtmlContent } from '@/components/html-content'
import { StatusBadge } from '@/components/status-badge'
import { requireAuth } from '@/lib/auth'
import { Button } from '@/ui/button'
import { Card, CardContent, CardHeader } from '@/ui/card'
import { Separator } from '@/ui/separator'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const mentoringId = Number(id)

  if (Number.isNaN(mentoringId)) {
    return { title: '멘토링 상세' }
  }

  try {
    const client = await requireAuth()
    const mentoring = await client.mentoring.get(mentoringId)
    return { title: mentoring.title }
  } catch {
    return { title: '멘토링 상세' }
  }
}

export default async function MentoringDetailPage({ params }: PageProps) {
  const { id } = await params
  const mentoringId = Number(id)

  if (Number.isNaN(mentoringId)) {
    notFound()
  }

  const client = await requireAuth()
  const mentoring = await client.mentoring.get(mentoringId)

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: '멘토링/특강', href: '/mentoring' }, { label: mentoring.title }]} />
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={mentoring.status} />
                <span className="text-sm text-foreground-muted">{mentoring.type}</span>
              </div>
              <form action={`/mentoring/${mentoring.id}/edit`}>
                <Button type="submit" variant="secondary" size="sm">
                  수정
                </Button>
              </form>
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
          <div className="grid gap-x-8 gap-y-0 md:grid-cols-2">
            <MetaItem label="장소" value={mentoring.venue || '-'} />
            <MetaItem
              label="접수 기간"
              value={`${mentoring.registrationPeriod.start} ~ ${mentoring.registrationPeriod.end}`}
            />
            <MetaItem label="참여 인원" value={`${mentoring.attendees.current} / ${mentoring.attendees.max}`} />
            <MetaItem label="작성자" value={mentoring.author} />
            <MetaItem label="등록일" value={mentoring.createdAt} />
            <MetaItem label="개설 승인" value={mentoring.approved ? '승인완료' : '대기'} />
            <MetaItem
              label="원본 링크"
              value={
                <a
                  href={`https://www.swmaestro.ai/sw/mypage/mentoLec/view.do?qustnrSn=${mentoring.id}&menuNo=200046`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  SWMaestro에서 보기 →
                </a>
              }
            />
          </div>
          <Separator />
          <HtmlContent content={mentoring.content} />
          {mentoring.applicants.length > 0 ? (
            <>
              <Separator />
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground">신청자 목록 ({mentoring.applicants.length}명)</h2>
                <div className="divide-y divide-border">
                  {mentoring.applicants.map((applicant) => (
                    <div
                      key={`${applicant.name}-${applicant.appliedAt}`}
                      className="flex items-center justify-between py-2"
                    >
                      <span className="text-sm text-foreground">{applicant.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-foreground-muted">{applicant.appliedAt}</span>
                        <StatusBadge status={applicant.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="w-16 shrink-0 text-xs text-foreground-muted">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  )
}
