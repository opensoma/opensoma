import { Notebook, Plus } from '@phosphor-icons/react/dist/ssr'
import type { Metadata } from 'next'
import Link from 'next/link'

import { Pagination } from '@/components/pagination'
import { StatusBadge } from '@/components/status-badge'
import { requireAuth } from '@/lib/auth'
import { Card, CardContent } from '@/ui/card'
import { EmptyState } from '@/ui/empty-state'
import { ResponsiveTable } from '@/ui/responsive-table'

export const metadata: Metadata = {
  title: '보고서',
}

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = await searchParams
  const page = Number(getFirstValue(resolvedSearchParams.page) ?? '1') || 1
  const client = await requireAuth()
  const reports = await client.report.list({ page })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">보고서</h1>
          <p className="text-sm text-foreground-muted">멘토링 보고서 목록을 확인하세요.</p>
        </div>
        <Link
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-[color,background-color,border-color] duration-150 hover:bg-primary-hover focus:outline-none"
          href="/report/new"
        >
          <Plus size={16} />
          보고서 작성
        </Link>
      </div>

      {reports.items.length === 0 ? (
        <Card className="border border-border">
          <CardContent>
            <EmptyState icon={Notebook} message="등록된 보고서가 없습니다." />
          </CardContent>
        </Card>
      ) : (
        <ResponsiveTable
          items={reports.items}
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
                <Link className="font-medium text-foreground hover:text-primary" href={`/report/${item.id}`}>
                  {item.title}
                </Link>
              ),
            },
            {
              header: '진행일',
              hideOnMobile: true,
              cell: (item) => item.progressDate,
            },
            {
              header: '상태',
              cell: (item) => <StatusBadge status={item.status} />,
            },
            {
              header: '작성자',
              hideOnMobile: true,
              cell: (item) => item.author,
            },
            {
              header: '등록일',
              hideOnMobile: true,
              cell: (item) => item.createdAt,
            },
            {
              header: '인정시간',
              hideOnMobile: true,
              cell: (item) => item.acceptedTime,
            },
            {
              header: '지급액',
              hideOnMobile: true,
              cell: (item) => item.payAmount,
            },
          ]}
        />
      )}

      <Pagination pagination={reports.pagination} />
    </div>
  )
}

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
