import type { Pagination as PaginationType } from '~/lib/sdk'
import { Button } from '~/ui/button'

interface PaginationProps {
  pagination: PaginationType
  pathname: string
  searchParams?: Record<string, string | undefined>
}

export function Pagination({ pagination, pathname, searchParams = {} }: PaginationProps) {
  if (pagination.totalPages <= 1) {
    return null
  }

  const pages = getPages(pagination.currentPage, pagination.totalPages)

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm text-foreground-muted">
        총 {pagination.total}건 · {pagination.currentPage} / {pagination.totalPages} 페이지
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <PageButton
          page={Math.max(1, pagination.currentPage - 1)}
          disabled={pagination.currentPage === 1}
          pathname={pathname}
          searchParams={searchParams}
        >
          이전
        </PageButton>
        {pages.map((page) => (
          <PageButton
            key={page}
            page={page}
            disabled={page === pagination.currentPage}
            isCurrent={page === pagination.currentPage}
            pathname={pathname}
            searchParams={searchParams}
          >
            {page}
          </PageButton>
        ))}
        <PageButton
          page={Math.min(pagination.totalPages, pagination.currentPage + 1)}
          disabled={pagination.currentPage === pagination.totalPages}
          pathname={pathname}
          searchParams={searchParams}
        >
          다음
        </PageButton>
      </div>
    </div>
  )
}

interface PageButtonProps {
  children: React.ReactNode
  page: number
  pathname: string
  searchParams: Record<string, string | undefined>
  isCurrent?: boolean
  disabled?: boolean
}

function PageButton({ children, page, pathname, searchParams, isCurrent = false, disabled = false }: PageButtonProps) {
  return (
    <form action={pathname} method="get">
      {Object.entries(searchParams).map(([key, value]) =>
        value && key !== 'page' ? <input key={key} type="hidden" name={key} value={value} /> : null,
      )}
      <input type="hidden" name="page" value={String(page)} />
      <Button disabled={disabled} size="sm" variant={isCurrent ? 'primary' : 'ghost'} className="font-semibold">
        {children}
      </Button>
    </form>
  )
}

function getPages(currentPage: number, totalPages: number) {
  const start = Math.max(1, currentPage - 2)
  const end = Math.min(totalPages, start + 4)
  const adjustedStart = Math.max(1, end - 4)

  return Array.from({ length: end - adjustedStart + 1 }, (_, index) => adjustedStart + index)
}
