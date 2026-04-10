import { Megaphone } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'

import { Pagination } from '~/components/pagination'
import { requireAuth } from '~/lib/auth'
import { Card, CardContent } from '~/ui/card'
import { EmptyState } from '~/ui/empty-state'
import { ResponsiveTable } from '~/ui/responsive-table'

export default async function NoticePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = await searchParams
  const page = Number(getFirstValue(resolvedSearchParams.page) ?? '1') || 1
  const client = await requireAuth()
  const notices = await client.notice.list({ page })

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">공지사항</h1>
        <p className="text-sm text-foreground-muted">센터 공지와 안내 사항을 확인하세요.</p>
      </div>

      {notices.items.length === 0 ? (
        <Card className="border border-border">
          <CardContent>
            <EmptyState icon={Megaphone} message="등록된 공지사항이 없습니다." />
          </CardContent>
        </Card>
      ) : (
        <ResponsiveTable
          items={notices.items}
          keyExtractor={(item) => item.id}
          columns={[
            {
              header: '제목',
              className: 'w-[60%]',
              cell: (item) => (
                <Link className="font-medium text-foreground hover:text-primary" href={`/notice/${item.id}`}>
                  {item.title}
                </Link>
              ),
            },
            {
              header: '작성자',
              cell: (item) => item.author,
            },
            {
              header: '등록일',
              cell: (item) => item.createdAt,
            },
          ]}
        />
      )}

      <Pagination pagination={notices.pagination} pathname="/notice" searchParams={{}} />
    </div>
  )
}

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
