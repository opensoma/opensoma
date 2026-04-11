import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'
import { Card } from '@/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/table'

interface ResponsiveTableColumn<T> {
  header: string
  cell: (item: T) => ReactNode
  className?: string
  hideOnMobile?: boolean
}

interface ResponsiveTableProps<T> {
  items: T[]
  columns: ResponsiveTableColumn<T>[]
  keyExtractor: (item: T) => string | number
  rowClassName?: (item: T) => string
}

export function ResponsiveTable<T>({ items, columns, keyExtractor, rowClassName }: ResponsiveTableProps<T>) {
  const mobileColumns = columns.filter((column) => !column.hideOnMobile)
  const mobileTitleColumn = columns.find((column) => column.header === '제목') ?? mobileColumns[0]
  const mobileDetailColumns = mobileColumns.filter((column) => column !== mobileTitleColumn)

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.header} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={keyExtractor(item)} className={rowClassName?.(item)}>
                {columns.map((column) => (
                  <TableCell key={column.header} className={column.className}>
                    {column.cell(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 md:hidden">
        {items.map((item) => (
          <Card
            key={keyExtractor(item)}
            className={cn('space-y-3 rounded-lg border border-border bg-surface p-4', rowClassName?.(item))}
          >
            {mobileTitleColumn ? (
              <div className="text-sm font-medium text-foreground">{mobileTitleColumn.cell(item)}</div>
            ) : null}

            {mobileDetailColumns.map((column) => (
              <div key={column.header} className="space-y-1">
                <div className="text-xs text-foreground-muted">{column.header}</div>
                <div className={cn('text-sm text-foreground', column.className)}>{column.cell(item)}</div>
              </div>
            ))}
          </Card>
        ))}
      </div>
    </>
  )
}
