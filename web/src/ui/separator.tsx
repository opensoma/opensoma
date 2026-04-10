import { Separator as BaseSeparator } from '@base-ui/react/separator'

import { cn } from '~/lib/cn'

interface SeparatorProps {
  className?: string
}

export function Separator({ className }: SeparatorProps) {
  return <BaseSeparator className={cn('h-px w-full bg-border', className)} />
}
