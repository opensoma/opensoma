'use client'

import { SignOut, User, X } from '@phosphor-icons/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { logout } from '@/app/logout/actions'
import { useShell } from '@/components/shell-context'
import { cn } from '@/lib/cn'
import { navItems } from '@/lib/nav-items'
import { Separator } from '@/ui/separator'

interface MobileDrawerProps {
  username?: string
}

export function MobileDrawer({ username }: MobileDrawerProps) {
  const pathname = usePathname()
  const firstNavItemRef = useRef<HTMLAnchorElement | null>(null)
  const { isMobileDrawerOpen, setIsMobileDrawerOpen } = useShell()

  useEffect(() => {
    if (!isMobileDrawerOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileDrawerOpen(false)
      }
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    requestAnimationFrame(() => {
      firstNavItemRef.current?.focus()
    })

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMobileDrawerOpen, setIsMobileDrawerOpen])

  useEffect(() => {
    setIsMobileDrawerOpen(false)
  }, [pathname, setIsMobileDrawerOpen])

  return (
    <div
      className={cn('fixed inset-0 z-50 md:hidden', isMobileDrawerOpen ? 'pointer-events-auto' : 'pointer-events-none')}
      aria-hidden={!isMobileDrawerOpen}
    >
      <button
        type="button"
        className={cn(
          'absolute inset-0 bg-black/50 transition-opacity duration-300',
          isMobileDrawerOpen ? 'opacity-100' : 'opacity-0',
        )}
        onClick={() => setIsMobileDrawerOpen(false)}
        aria-label="네비게이션 닫기"
        tabIndex={isMobileDrawerOpen ? 0 : -1}
      />
      <div
        id="mobile-navigation-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="네비게이션"
        className={cn(
          'relative flex h-full w-64 flex-col bg-surface shadow-[var(--shadow-elevation-3)] transition-transform duration-300',
          isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <Link href="/" className="text-lg font-extrabold text-foreground">
            오픈소마
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-muted hover:text-foreground focus:outline-none"
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-label="네비게이션 닫기"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
          {navItems.map((item, index) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
            const IconComponent = item.icon

            return (
              <Link
                key={item.href}
                ref={index === 0 ? firstNavItemRef : undefined}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 overflow-hidden rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus:outline-none',
                  isActive
                    ? 'bg-primary-light font-semibold text-primary'
                    : 'text-foreground-muted hover:bg-muted hover:text-foreground',
                )}
              >
                <IconComponent size={18} weight={isActive ? 'fill' : 'regular'} />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>
        {username && (
          <div className="border-t border-border p-4">
            <Separator className="mb-3" />
            <div className="flex flex-col gap-1">
              <span className="px-3 py-2 text-sm font-medium text-foreground">{username}</span>
              <Link
                href="/member"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-foreground-muted transition-colors hover:bg-muted hover:text-foreground"
              >
                <User size={18} />
                <span>회원정보</span>
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-foreground-muted transition-colors hover:bg-muted hover:text-foreground"
              >
                <SignOut size={18} />
                <span>로그아웃</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
