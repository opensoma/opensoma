'use client'

import { Tooltip } from '@base-ui/react/tooltip'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useShell } from '~/components/shell-context'
import { cn } from '~/lib/cn'
import { navItems } from '~/lib/nav-items'

export function Sidebar() {
  const pathname = usePathname()
  const { isSidebarCollapsed, toggleSidebarCollapsed } = useShell()

  return (
    <Tooltip.Provider>
      <aside
        className={cn(
          'sticky top-16 hidden h-[calc(100vh-4rem)] overflow-hidden border-r border-border bg-surface transition-[width] duration-300 md:flex md:flex-col',
          isSidebarCollapsed ? 'md:w-16' : 'md:w-56',
        )}
      >
        <nav className="flex flex-1 flex-col gap-0.5 p-4">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const IconComponent = item.icon
            const linkClassName = cn(
              'flex items-center overflow-hidden rounded-lg py-2 text-sm font-semibold transition-colors focus:outline-none',
              isSidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3',
              isActive
                ? 'bg-primary-light text-primary font-semibold'
                : 'text-foreground-muted hover:bg-muted hover:text-foreground',
            )
            const labelClassName = cn(
              'truncate whitespace-nowrap transition-opacity duration-200',
              isSidebarCollapsed ? 'w-0 opacity-0' : 'opacity-100',
            )

            if (!isSidebarCollapsed) {
              return (
                <Link key={item.href} href={item.href} className={linkClassName}>
                  <IconComponent size={18} weight={isActive ? 'fill' : 'regular'} />
                  <span className={labelClassName}>{item.label}</span>
                </Link>
              )
            }

            return (
              <Tooltip.Root key={item.href}>
                <Tooltip.Trigger
                  render={
                    <Link href={item.href} className={linkClassName} aria-label={item.label}>
                      <IconComponent size={18} weight={isActive ? 'fill' : 'regular'} />
                      <span className={labelClassName}>{item.label}</span>
                    </Link>
                  }
                />
                <Tooltip.Portal>
                  <Tooltip.Positioner side="right" sideOffset={12}>
                    <Tooltip.Popup className="rounded-lg bg-surface px-2.5 py-1.5 text-xs font-medium text-foreground shadow-[var(--shadow-elevation-2)] transition-[opacity,transform] duration-150 data-[ending-style]:translate-x-1 data-[ending-style]:opacity-0 data-[starting-style]:translate-x-1 data-[starting-style]:opacity-0">
                      {item.label}
                    </Tooltip.Popup>
                  </Tooltip.Positioner>
                </Tooltip.Portal>
              </Tooltip.Root>
            )
          })}
        </nav>
        <div className="border-t border-border p-2">
          <button
            type="button"
            className="flex w-full items-center justify-center rounded-lg px-3 py-2 text-foreground-muted transition-colors hover:bg-muted hover:text-foreground focus:outline-none"
            onClick={toggleSidebarCollapsed}
            aria-label={isSidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
            aria-pressed={isSidebarCollapsed}
          >
            {isSidebarCollapsed ? <CaretRight size={18} /> : <CaretLeft size={18} />}
          </button>
        </div>
      </aside>
    </Tooltip.Provider>
  )
}
