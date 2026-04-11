'use client'

import { Menu as BaseMenu } from '@base-ui/react/menu'
import { type ReactNode } from 'react'

import { cn } from '@/lib/cn'

interface MenuProps {
  children: ReactNode
}

export function Menu({ children }: MenuProps) {
  return <BaseMenu.Root>{children}</BaseMenu.Root>
}

interface MenuTriggerProps {
  children: ReactNode
  className?: string
}

export function MenuTrigger({ children, className }: MenuTriggerProps) {
  return <BaseMenu.Trigger className={className}>{children}</BaseMenu.Trigger>
}

interface MenuContentProps {
  children: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  className?: string
}

export function MenuContent({
  children,
  side = 'bottom',
  align = 'start',
  sideOffset = 4,
  className,
}: MenuContentProps) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner side={side} align={align} sideOffset={sideOffset}>
        <BaseMenu.Popup
          className={cn(
            'z-50 min-w-56 overflow-hidden rounded-lg border border-border bg-surface p-1 shadow-[var(--shadow-elevation-3)] outline-none',
            'will-change-transform',
            'transition-all duration-100 ease-out',
            'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
            'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
            className,
          )}
        >
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  )
}

interface MenuItemProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function MenuItem({ children, className, onClick }: MenuItemProps) {
  return (
    <BaseMenu.Item
      className={cn(
        'flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground transition-colors outline-none hover:bg-muted focus:bg-muted',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </BaseMenu.Item>
  )
}

interface MenuSeparatorProps {
  className?: string
}

export function MenuSeparator({ className }: MenuSeparatorProps) {
  return <BaseMenu.Separator className={cn('my-1 h-px bg-border', className)} />
}

interface MenuLabelProps {
  children: ReactNode
  className?: string
}

export function MenuLabel({ children, className }: MenuLabelProps) {
  return <div className={cn('px-3 py-1.5 text-sm text-foreground-muted', className)}>{children}</div>
}
