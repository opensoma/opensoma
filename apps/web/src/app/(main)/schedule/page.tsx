import { CalendarBlank } from '@phosphor-icons/react/dist/ssr'
import type { Metadata } from 'next'

import { Pagination } from '@/components/pagination'
import { requireAuth } from '@/lib/auth'
import { Card, CardContent } from '@/ui/card'
import { EmptyState } from '@/ui/empty-state'
import { ResponsiveTable } from '@/ui/responsive-table'

export const metadata: Metadata = {
  title: '월간일정',
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = await searchParams
  const page = Number(getFirstValue(resolvedSearchParams.page) ?? '1') || 1
  const client = await requireAuth()
  const schedule = await client.schedule.list({ page })

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">월간일정</h1>
        <p className="text-sm text-foreground-muted">센터 일정을 확인하세요.</p>
      </div>

      {schedule.items.length === 0 ? (
        <Card className="border border-border">
          <CardContent>
            <EmptyState icon={CalendarBlank} message="등록된 일정이 없습니다." />
          </CardContent>
        </Card>
      ) : (
        <ResponsiveTable
          items={schedule.items}
          keyExtractor={(item) => item.id}
          columns={[
            {
              header: '구분',
              cell: (item) => item.category,
            },
            {
              header: '제목',
              className: 'w-[40%]',
              cell: (item) => <span className="font-medium text-foreground">{item.title}</span>,
            },
            {
              header: '일정',
              hideOnMobile: true,
              cell: (item) => `${item.period.start} ~ ${item.period.end}`,
            },
          ]}
        />
      )}

      <Pagination pagination={schedule.pagination} />
    </div>
  )
}

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
