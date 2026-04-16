import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type React from 'react'

import { Breadcrumb } from '@/components/breadcrumb'
import { HtmlContent } from '@/components/html-content'
import { StatusBadge } from '@/components/status-badge'
import { requireAuth } from '@/lib/auth'
import { Card, CardContent, CardHeader } from '@/ui/card'
import { Separator } from '@/ui/separator'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const reportId = Number(id)

  if (Number.isNaN(reportId)) {
    return { title: '보고서 상세' }
  }

  try {
    const client = await requireAuth()
    const report = await client.report.get(reportId)
    return { title: report.subject || report.title }
  } catch {
    return { title: '보고서 상세' }
  }
}

export default async function ReportDetailPage({ params }: PageProps) {
  const { id } = await params
  const reportId = Number(id)

  if (Number.isNaN(reportId)) {
    notFound()
  }

  const client = await requireAuth()
  const report = await client.report.get(reportId)

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: '보고서', href: '/report' }, { label: report.subject || report.title }]} />
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={report.status} />
              <span className="text-sm text-foreground-muted">{report.category}</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">{report.subject || report.title}</h1>
              <p className="text-sm text-foreground-muted">
                {report.progressDate} · {report.progressStartTime} ~ {report.progressEndTime}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid gap-x-8 gap-y-0 md:grid-cols-2">
            <MetaItem label="보고서 유형" value={report.reportType} />
            <MetaItem label="멘티 지역" value={report.menteeRegion} />
            <MetaItem label="장소" value={report.venue || '-'} />
            <MetaItem label="팀명" value={report.teamNames || '-'} />
            <MetaItem label="참석 인원" value={String(report.attendanceCount)} />
            <MetaItem label="참석자" value={report.attendanceNames || '-'} />
            {report.nonAttendanceNames ? <MetaItem label="불참자" value={report.nonAttendanceNames} /> : null}
            {report.exceptStartTime && report.exceptEndTime ? (
              <MetaItem label="제외 시간" value={`${report.exceptStartTime} ~ ${report.exceptEndTime}`} />
            ) : null}
            {report.exceptReason ? <MetaItem label="제외 사유" value={report.exceptReason} /> : null}
            <MetaItem label="작성자" value={report.author} />
            <MetaItem label="등록일" value={report.createdAt} />
            <MetaItem label="인정시간" value={report.acceptedTime || '-'} />
            <MetaItem label="지급액" value={report.payAmount || '-'} />
            <MetaItem
              label="원본 링크"
              value={
                <a
                  href={`https://www.swmaestro.ai/sw/mypage/mentoringReport/view.do?reportId=${report.id}&menuNo=200049`}
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
          <HtmlContent content={report.content} />
          {report.mentorOpinion ? (
            <>
              <Separator />
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground">멘토 의견</h2>
                <p className="text-sm text-foreground">{report.mentorOpinion}</p>
              </div>
            </>
          ) : null}
          {report.etc ? (
            <>
              <Separator />
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground">기타</h2>
                <p className="text-sm text-foreground">{report.etc}</p>
              </div>
            </>
          ) : null}
          {report.files.length > 0 ? (
            <>
              <Separator />
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground">첨부파일 ({report.files.length}건)</h2>
                <ul className="space-y-1">
                  {report.files.map((file, index) => (
                    <li key={file}>
                      <a
                        href={file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        첨부파일 {index + 1}
                      </a>
                    </li>
                  ))}
                </ul>
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
      <span className="w-20 shrink-0 text-xs text-foreground-muted">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  )
}
