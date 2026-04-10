import type { ReactNode } from 'react'

import { cn } from '~/lib/cn'

interface TableElementProps {
  className?: string
  children: ReactNode
}

export function Table({ className, children }: TableElementProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <table className={cn('w-full text-left text-sm', className)}>{children}</table>
    </div>
  )
}

export function TableHeader({ className, children }: TableElementProps) {
  return <thead className={cn('border-b border-border bg-muted', className)}>{children}</thead>
}

export function TableBody({ className, children }: TableElementProps) {
  return <tbody className={cn('divide-y divide-border-muted', className)}>{children}</tbody>
}

export function TableRow({ className, children }: TableElementProps) {
  return <tr className={cn('hover:bg-muted/50 transition-colors', className)}>{children}</tr>
}

export function TableHead({ className, children }: TableElementProps) {
  return <th className={cn('px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground bg-muted', className)}>{children}</th>
}

export function TableCell({ className, children }: TableElementProps) {
  return <td className={cn('px-4 py-3', className)}>{children}</td>
}
