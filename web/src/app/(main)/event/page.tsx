import { Newspaper } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'

import { Pagination } from '~/components/pagination'
import { StatusBadge } from '~/components/status-badge'
import { requireAuth } from '~/lib/auth'
import { Card, CardContent } from '~/ui/card'
import { EmptyState } from '~/ui/empty-state'
import { ResponsiveTable } from '~/ui/responsive-table'

export default async function EventPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = await searchParams
  const page = Number(getFirstValue(resolvedSearchParams.page) ?? '1') || 1
  const client = await requireAuth()
  const events = await client.event.list({ page })

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">행사 게시판</h1>
        <p className="text-sm text-foreground-muted">행사 일정과 접수 기간을 확인하세요.</p>
      </div>

      {events.items.length === 0 ? (
        <Card className="border border-border">
          <CardContent>
            <EmptyState icon={Newspaper} message="등록된 행사가 없습니다." />
          </CardContent>
        </Card>
      ) : (
        <ResponsiveTable
          items={events.items}
          keyExtractor={(item) => item.id}
          columns={[
            {
              header: '구분',
              cell: (item) => item.category,
            },
            {
              header: '제목',
              className: 'w-[28%]',
              cell: (item) => (
                <Link className="font-medium text-foreground hover:text-primary" href={`/event/${item.id}`}>
                  {item.title}
                </Link>
              ),
            },
            {
              header: '접수 기간',
              hideOnMobile: true,
              cell: (item) => `${item.registrationPeriod.start} ~ ${item.registrationPeriod.end}`,
            },
            {
              header: '행사 기간',
              hideOnMobile: true,
              cell: (item) => `${item.eventPeriod.start} ~ ${item.eventPeriod.end}`,
            },
            {
              header: '상태',
              cell: (item) => <StatusBadge status={item.status} />,
            },
            {
              header: '등록일',
              hideOnMobile: true,
              cell: (item) => item.createdAt,
            },
          ]}
        />
      )}

      <Pagination pagination={events.pagination} pathname="/event" searchParams={{}} />
    </div>
  )
}

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
