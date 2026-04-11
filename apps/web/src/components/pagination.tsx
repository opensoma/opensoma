'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

import type { Pagination as PaginationType } from '@/lib/sdk'
import { Button } from '@/ui/button'

interface PaginationProps {
  pagination: PaginationType
}

export function Pagination({ pagination }: PaginationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentPage = Number(searchParams.get('page')) || 1

  if (pagination.totalPages <= 1) {
    return null
  }

  const pages = getPages(currentPage, pagination.totalPages)

  const createPageURL = (page: number) => {
    const params = new URLSearchParams(searchParams)
    if (page === 1) {
      params.delete('page')
    } else {
      params.set('page', String(page))
    }
    return `${pathname}?${params.toString()}`
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm text-foreground-muted">
        총 {pagination.total}건 · {currentPage} / {pagination.totalPages} 페이지
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <PageButton href={createPageURL(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
          이전
        </PageButton>
        {pages.map((page) => (
          <PageButton key={page} href={createPageURL(page)} isCurrent={page === currentPage}>
            {page}
          </PageButton>
        ))}
        <PageButton
          href={createPageURL(Math.min(pagination.totalPages, currentPage + 1))}
          disabled={currentPage === pagination.totalPages}
        >
          다음
        </PageButton>
      </div>
    </div>
  )
}

interface PageButtonProps {
  children: React.ReactNode
  href: string
  isCurrent?: boolean
  disabled?: boolean
}

function PageButton({ children, href, isCurrent = false, disabled = false }: PageButtonProps) {
  if (isCurrent) {
    return (
      <Button size="sm" variant="primary" className="cursor-default font-semibold">
        {children}
      </Button>
    )
  }

  if (disabled) {
    return (
      <Button disabled size="sm" variant="ghost" className="font-semibold">
        {children}
      </Button>
    )
  }

  return (
    <Link href={href} scroll={false}>
      <Button size="sm" variant="ghost" className="font-semibold hover:bg-muted">
        {children}
      </Button>
    </Link>
  )
}

function getPages(currentPage: number, totalPages: number) {
  const start = Math.max(1, currentPage - 2)
  const end = Math.min(totalPages, start + 4)
  const adjustedStart = Math.max(1, end - 4)

  return Array.from({ length: end - adjustedStart + 1 }, (_, index) => adjustedStart + index)
}
