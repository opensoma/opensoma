'use client'

import { List } from '@phosphor-icons/react'

import { LogoutButton } from '~/components/logout-button'
import { useShell } from '~/components/shell-context'
import { ThemeToggle } from '~/components/theme-toggle'
import { cn } from '~/lib/cn'

interface NavShellProps {
  isLoggedIn: boolean
  username: string
}

export function NavShell({ isLoggedIn, username }: NavShellProps) {
  const { isMobileDrawerOpen, toggleMobileDrawer } = useShell()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface">
      <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className={cn(
              'inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-muted hover:text-foreground focus:outline-none md:hidden',
            )}
            onClick={toggleMobileDrawer}
            aria-label={isMobileDrawerOpen ? '네비게이션 닫기' : '네비게이션 열기'}
            aria-controls="mobile-navigation-drawer"
            aria-expanded={isMobileDrawerOpen}
            aria-haspopup="dialog"
          >
            <List size={20} />
          </button>
          <div className="flex min-w-0 items-center gap-3">
            <h1 className="truncate text-lg font-extrabold text-foreground">SW마에스트로</h1>
            <span className="hidden text-sm font-semibold text-foreground-muted md:inline">마이페이지</span>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <ThemeToggle />
          {isLoggedIn ? (
            <>
              <span className="hidden text-sm text-foreground-muted md:inline">{username}</span>
              <LogoutButton />
            </>
          ) : null}
        </div>
      </div>
    </header>
  )
}
