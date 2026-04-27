import { ChalkboardTeacher } from '@phosphor-icons/react/dist/ssr'
import type { Metadata } from 'next'
import { parseSearchQuery } from 'opensoma/shared/utils/mentoring-params'

import { MentoringFilters } from '@/app/(main)/mentoring/components/mentoring-filters'
import { Pagination } from '@/components/pagination'
import { StatusBadge } from '@/components/status-badge'
import { requireAuth } from '@/lib/auth'
import { Button } from '@/ui/button'
import { Card, CardContent } from '@/ui/card'
import { EmptyState } from '@/ui/empty-state'
import Link from '@/ui/link'
import { ResponsiveTable } from '@/ui/responsive-table'

export const metadata: Metadata = {
  title: '멘토링/특강',
}

function isPastDate(dateStr: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const itemDate = new Date(dateStr.replace(/\./g, '-'))
  return itemDate < today
}

function TypeBadge({ type }: { type: string }) {
  if (type === '자유 멘토링') {
    return (
      <div className="flex items-center gap-1.5">
        <span className="inline-block size-2 rounded-full bg-emerald-500" />
        <span className="text-sm">{type}</span>
      </div>
    )
  }
  if (type === '멘토 특강') {
    return (
      <div className="flex items-center gap-1.5">
        <span className="inline-block size-2 rounded-full bg-amber-500" />
        <span className="text-sm">{type}</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-block size-2 rounded-full bg-foreground-muted" />
      <span className="text-sm">{type}</span>
    </div>
  )
}

export default async function MentoringPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = await searchParams
  const page = Number(getFirstValue(resolvedSearchParams.page) ?? '1') || 1
  const status = getFirstValue(resolvedSearchParams.status) || undefined
  const type = getFirstValue(resolvedSearchParams.type) || undefined
  const searchRaw = getFirstValue(resolvedSearchParams.search)
  const search = parseSearchQuery(searchRaw === 'all' || !searchRaw ? '' : searchRaw)
  const client = await requireAuth()
  const mentoring = await client.mentoring.list({ page, status, type, search })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">멘토링/특강</h1>
          <p className="text-sm text-foreground-muted">모집 중인 멘토링과 특강을 확인하고 새 글을 등록하세요.</p>
        </div>
        <div className="flex gap-2">
          <form action="/mentoring/history">
            <Button type="submit" variant="secondary">
              신청 내역
            </Button>
          </form>
          <form action="/mentoring/new">
            <Button type="submit">글쓰기</Button>
          </form>
        </div>
      </div>

      <MentoringFilters initialSearch={searchRaw ?? null} />

      {mentoring.items.length === 0 ? (
        <Card className="border border-border">
          <CardContent>
            <EmptyState icon={ChalkboardTeacher} message="조건에 맞는 멘토링이 없습니다." />
          </CardContent>
        </Card>
      ) : (
        <ResponsiveTable
          items={mentoring.items}
          keyExtractor={(item) => item.id}
          rowClassName={(item) => (isPastDate(item.sessionDate) ? 'opacity-50' : '')}
          columns={[
            {
              header: '유형',
              cell: (item) => <TypeBadge type={item.type} />,
            },
            {
              header: '제목',
              className: 'w-[32%]',
              cell: (item) => (
                <Link className="font-medium text-foreground hover:text-primary" href={`/mentoring/${item.id}`}>
                  {item.title}
                </Link>
              ),
            },
            {
              header: '진행 일시',
              hideOnMobile: true,
              cell: (item) => (
                <>
                  <div className={isPastDate(item.sessionDate) ? 'text-foreground-muted' : ''}>{item.sessionDate}</div>
                  <div className="text-xs text-foreground-muted">
                    {item.sessionTime.start} ~ {item.sessionTime.end}
                  </div>
                </>
              ),
            },
            {
              header: '인원',
              cell: (item) => `${item.attendees.current} / ${item.attendees.max}`,
            },
            {
              header: '상태',
              cell: (item) => <StatusBadge status={item.status} />,
            },
            {
              header: '작성자',
              cell: (item) => item.author,
            },
          ]}
        />
      )}

      <Pagination pagination={mentoring.pagination} />
    </div>
  )
}

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
