'use client'

import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible'
import { CaretDown } from '@phosphor-icons/react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { cn } from '@/lib/cn'

interface CollapsibleProps {
  children: ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  className?: string
}

export function Collapsible({ children, className, ...props }: CollapsibleProps) {
  return (
    <BaseCollapsible.Root className={cn('rounded-lg border border-border', className)} {...props}>
      {children}
    </BaseCollapsible.Root>
  )
}

interface CollapsibleTriggerProps extends Omit<ComponentPropsWithoutRef<typeof BaseCollapsible.Trigger>, 'children'> {
  children: ReactNode
}

export function CollapsibleTrigger({ children, className, ...props }: CollapsibleTriggerProps) {
  return (
    <BaseCollapsible.Trigger
      className={cn(
        'flex w-full cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted',
        className,
      )}
      {...props}
    >
      {children}
      <CaretDown
        className="size-3.5 text-foreground-muted transition-transform duration-200 [[data-panel-open]_&]:rotate-180"
        size={14}
      />
    </BaseCollapsible.Trigger>
  )
}

interface CollapsiblePanelProps extends Omit<ComponentPropsWithoutRef<typeof BaseCollapsible.Panel>, 'children'> {
  children: ReactNode
}

export function CollapsiblePanel({ children, className, ...props }: CollapsiblePanelProps) {
  return (
    <BaseCollapsible.Panel
      className={cn(
        'grid overflow-hidden border-t border-border transition-[grid-template-rows] duration-200 ease-out',
        'data-[state=closed]:grid-rows-[0fr]',
        'data-[state=open]:grid-rows-[1fr]',
        className,
      )}
      {...props}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="p-4">{children}</div>
      </div>
    </BaseCollapsible.Panel>
  )
}
