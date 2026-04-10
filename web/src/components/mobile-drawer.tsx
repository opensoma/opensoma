'use client'

import { X } from '@phosphor-icons/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { useShell } from '~/components/shell-context'
import { cn } from '~/lib/cn'
import { navItems } from '~/lib/nav-items'

export function MobileDrawer() {
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
      className={cn(
        'fixed inset-0 z-50 md:hidden',
        isMobileDrawerOpen ? 'pointer-events-auto' : 'pointer-events-none',
      )}
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
          <div className="flex items-center gap-3">
            <span className="text-lg font-extrabold text-foreground">SW마에스트로</span>
            <span className="text-sm font-semibold text-foreground-muted">마이페이지</span>
          </div>
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
            const isActive = pathname.startsWith(item.href)
            const IconComponent = item.icon

            return (
              <Link
                key={item.href}
                ref={index === 0 ? firstNavItemRef : undefined}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 overflow-hidden rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus:outline-none',
                  isActive
                    ? 'bg-primary-light text-primary font-semibold'
                    : 'text-foreground-muted hover:bg-muted hover:text-foreground',
                )}
              >
                <IconComponent size={18} weight={isActive ? 'fill' : 'regular'} />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
