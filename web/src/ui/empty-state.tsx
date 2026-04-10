import type { Icon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

import { cn } from '~/lib/cn'

interface EmptyStateProps {
  message: string
  icon?: Icon
  action?: ReactNode
  className?: string
}

export function EmptyState({ message, icon: IconComponent, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-lg border border-border py-16',
        className,
      )}
    >
      {IconComponent && <IconComponent size={48} weight="thin" className="text-foreground-muted" />}
      <p className="text-sm font-medium text-foreground-muted">{message}</p>
      {action}
    </div>
  )
}
