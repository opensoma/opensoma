'use client'

import Link from 'next/link'
import { CaretRight } from '@phosphor-icons/react'
import { cn } from '~/lib/cn'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1.5 text-sm', className)}>
      {items.map((item, index) => (
        <span key={item.label} className="flex items-center gap-1.5">
          {index > 0 && <CaretRight size={12} className="text-foreground-muted" />}
          {item.href ? (
            <Link
              href={item.href}
              className="text-foreground-muted transition-colors duration-150 hover:text-foreground"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-foreground truncate">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
