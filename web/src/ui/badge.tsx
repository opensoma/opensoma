import type { ReactNode } from 'react'

import { cn } from '~/lib/cn'

const badgeVariants = {
  default: 'bg-muted text-foreground border border-border',
  primary: 'bg-primary-light text-primary border border-primary/20',
  success: 'bg-success-muted text-success-foreground border border-success/20',
  danger: 'bg-danger-muted text-danger-foreground border border-danger/20',
  warning: 'bg-warning-muted text-warning-foreground border border-warning/20',
  info: 'bg-info-muted text-info-foreground border border-info/20',
} as const

interface BadgeProps {
  variant?: keyof typeof badgeVariants
  className?: string
  children: ReactNode
}

export function Badge({ variant = 'default', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
        badgeVariants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
