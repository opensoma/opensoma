import { CalendarBlank, CaretLeft, CaretRight } from '@phosphor-icons/react/dist/ssr'
import type { Metadata } from 'next'

import { Pagination } from '@/components/pagination'
import { requireAuth } from '@/lib/auth'
import { buttonVariants } from '@/ui/button'
import { Card, CardContent } from '@/ui/card'
import { EmptyState } from '@/ui/empty-state'
import Link from '@/ui/link'
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
  const month = normalizeMonth(getFirstValue(resolvedSearchParams.month)) ?? currentKoreaMonth()
  const client = await requireAuth()
  const schedule = await client.schedule.list({ page, month })
  const previousMonth = shiftMonth(month, -1)
  const nextMonth = shiftMonth(month, 1)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">월간일정</h1>
          <p className="text-sm text-foreground-muted">센터 일정을 확인하세요.</p>
        </div>
        <div className="inline-flex items-center overflow-hidden rounded-lg border border-border bg-muted/50">
          <Link
            href={scheduleMonthHref(previousMonth)}
            scroll={false}
            className={buttonVariants({
              variant: 'ghost',
              size: 'sm',
              className: 'rounded-none border-0',
            })}
            aria-label={`${formatMonthLabel(previousMonth)} 조회`}
          >
            <CaretLeft size={16} weight="bold" />
          </Link>
          <div className="flex h-9 min-w-28 items-center justify-center border-x border-border px-3 text-center text-sm font-semibold text-foreground">
            {formatMonthLabel(month)}
          </div>
          <Link
            href={scheduleMonthHref(nextMonth)}
            scroll={false}
            className={buttonVariants({
              variant: 'ghost',
              size: 'sm',
              className: 'rounded-none border-0',
            })}
            aria-label={`${formatMonthLabel(nextMonth)} 조회`}
          >
            <CaretRight size={16} weight="bold" />
          </Link>
        </div>
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

function normalizeMonth(value: string | undefined): string | null {
  return value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : null
}

function currentKoreaMonth(): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date())
}

function shiftMonth(month: string, offset: number): string {
  const [year, monthNumber] = month.split('-').map(Number)
  const date = new Date(Date.UTC(year, monthNumber - 1 + offset, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

function formatMonthLabel(month: string): string {
  const [year, monthNumber] = month.split('-')
  return `${year}년 ${Number(monthNumber)}월`
}

function scheduleMonthHref(month: string): string {
  return `/schedule?month=${month}`
}
