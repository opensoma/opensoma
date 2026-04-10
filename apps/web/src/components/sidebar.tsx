'use client'

import { Tooltip } from '@base-ui/react/tooltip'
import { Check, Desktop, Moon, SidebarSimple, SignOut, Sun, User, UserCircle } from '@phosphor-icons/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { logout } from '@/app/logout/actions'
import { useShell } from '@/components/shell-context'
import { cn } from '@/lib/cn'
import { navItems } from '@/lib/nav-items'
import { useTheme } from '@/lib/theme'
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from '@/ui/menu'

interface SidebarProps {
  username?: string
}

export function Sidebar({ username }: SidebarProps) {
  const pathname = usePathname()
  const { isSidebarCollapsed, toggleSidebarCollapsed } = useShell()
  const { theme, setTheme } = useTheme()

  return (
    <Tooltip.Provider>
      <aside
        className={cn(
          'sticky top-0 hidden h-screen overflow-hidden border-r border-border bg-surface transition-[width] duration-300 md:flex md:flex-col',
          isSidebarCollapsed ? 'md:w-16' : 'md:w-56',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!isSidebarCollapsed && (
            <Link href="/" className="flex items-center gap-2 text-lg font-extrabold text-foreground hover:opacity-80">
              오픈소마
            </Link>
          )}
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-muted hover:text-foreground focus:outline-none"
            onClick={toggleSidebarCollapsed}
            aria-label={isSidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
            aria-pressed={isSidebarCollapsed}
          >
            <SidebarSimple size={18} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
          {navItems.map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
            const IconComponent = item.icon
            const linkClassName = cn(
              'flex items-center overflow-hidden rounded-lg py-2 text-sm font-semibold transition-colors focus:outline-none',
              isSidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3',
              isActive
                ? 'bg-primary-light font-semibold text-primary'
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

        {username && (
          <div className="shrink-0 border-t border-border p-3">
            <Menu>
              <MenuTrigger
                className={cn(
                  'group flex w-full items-center gap-2.5 rounded-lg px-2 py-2 transition-colors',
                  isSidebarCollapsed ? 'justify-center px-0' : 'hover:bg-muted',
                )}
              >
                <div
                  className={cn(
                    'flex shrink-0 items-center justify-center rounded-full bg-primary-light text-primary',
                    isSidebarCollapsed ? 'h-8 w-8' : 'h-8 w-8',
                  )}
                >
                  <UserCircle size={isSidebarCollapsed ? 20 : 20} />
                </div>
                {!isSidebarCollapsed && (
                  <div className="flex min-w-0 flex-1 flex-col overflow-hidden text-left">
                    <span className="truncate text-sm font-medium text-foreground">{username}</span>
                  </div>
                )}
              </MenuTrigger>
              <MenuContent side="top" align="start" sideOffset={8} className="min-w-56">
                <MenuLabel>{username}</MenuLabel>
                <MenuSeparator />
                <Link href="/member" className="contents">
                  <MenuItem>
                    <User size={16} />
                    회원정보
                  </MenuItem>
                </Link>
                <MenuSeparator />
                <MenuLabel>테마</MenuLabel>
                <MenuItem onClick={() => setTheme('light')}>
                  <Sun size={16} />
                  라이트
                  {theme === 'light' && <Check size={16} className="ml-auto text-primary" />}
                </MenuItem>
                <MenuItem onClick={() => setTheme('dark')}>
                  <Moon size={16} />
                  다크
                  {theme === 'dark' && <Check size={16} className="ml-auto text-primary" />}
                </MenuItem>
                <MenuItem onClick={() => setTheme('system')}>
                  <Desktop size={16} />
                  시스템
                  {theme === 'system' && <Check size={16} className="ml-auto text-primary" />}
                </MenuItem>
                <MenuSeparator />
                <MenuItem onClick={() => logout()}>
                  <SignOut size={16} />
                  로그아웃
                </MenuItem>
              </MenuContent>
            </Menu>
          </div>
        )}
      </aside>
    </Tooltip.Provider>
  )
}
