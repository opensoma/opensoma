import { ChalkboardTeacher } from '@phosphor-icons/react/dist/ssr'

import { Pagination } from '~/components/pagination'
import { StatusBadge } from '~/components/status-badge'
import { requireAuth } from '~/lib/auth'
import { Card, CardContent } from '~/ui/card'
import { EmptyState } from '~/ui/empty-state'
import { ResponsiveTable } from '~/ui/responsive-table'

export default async function MentoringHistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = await searchParams
  const page = Number(getFirstValue(resolvedSearchParams.page) ?? '1') || 1
  const client = await requireAuth()
  const history = await client.mentoring.history({ page })

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">신청 내역</h1>
        <p className="text-sm text-foreground-muted">내가 신청한 멘토링과 특강 이력을 확인하세요.</p>
      </div>

      {history.items.length === 0 ? (
        <Card className="border border-border">
          <CardContent>
            <EmptyState icon={ChalkboardTeacher} message="신청 내역이 없습니다." />
          </CardContent>
        </Card>
      ) : (
        <ResponsiveTable
          items={history.items}
          keyExtractor={(item) => `${item.id}-${item.title}`}
          columns={[
            {
              header: '구분',
              cell: (item) => item.category,
            },
            {
              header: '제목',
              cell: (item) => item.title,
            },
            {
              header: '작성자',
              cell: (item) => item.author,
            },
            {
              header: '강의날짜',
              cell: (item) => item.sessionDate,
            },
            {
              header: '접수일',
              hideOnMobile: true,
              cell: (item) => item.appliedAt,
            },
            {
              header: '접수상태',
              cell: (item) => <StatusBadge status={item.applicationStatus} />,
            },
            {
              header: '개설승인',
              cell: (item) => <StatusBadge status={item.approvalStatus} />,
            },
          ]}
        />
      )}

      <Pagination pagination={history.pagination} pathname="/mentoring/history" searchParams={{}} />
    </div>
  )
}

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
