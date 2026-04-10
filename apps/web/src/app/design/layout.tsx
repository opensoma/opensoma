'use client'

import {
  Monitor,
  Moon,
  Sun,
  Palette,
  TextT,
  CursorClick,
  Tag,
  Cards,
  Table,
  CheckSquare,
  Minus,
  Stack,
  Cursor,
  SquaresFour,
  ArrowBendUpLeft,
  PaintBucket,
  Clock,
} from '@phosphor-icons/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'
import { useTheme } from '@/lib/theme'

const foundations = [
  { path: '/design/colors', label: 'Colors', icon: Palette },
  { path: '/design/shadow-elevation', label: 'Shadow Elevation', icon: Stack },
  { path: '/design/slot-colors', label: 'Slot Colors', icon: PaintBucket },
  { path: '/design/transitions', label: 'Transitions', icon: Clock },
  { path: '/design/typography', label: 'Typography', icon: TextT },
]

const components = [
  { path: '/design/badges', label: 'Badge', icon: Tag },
  { path: '/design/breadcrumb', label: 'Breadcrumb', icon: ArrowBendUpLeft },
  { path: '/design/buttons', label: 'Button', icon: CursorClick },
  { path: '/design/cards', label: 'Card', icon: Cards },
  { path: '/design/empty-state', label: 'Empty State', icon: Minus },
  { path: '/design/empty-states', label: 'Empty States', icon: SquaresFour },
  { path: '/design/forms', label: 'Form', icon: CheckSquare },
  { path: '/design/interactive-card', label: 'Interactive Card', icon: Cursor },
  { path: '/design/tables', label: 'Table', icon: Table },
]

export default function DesignLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <DesignSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}

function DesignSidebar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  return (
    <aside className="sticky top-0 hidden h-screen w-56 flex-col overflow-hidden border-r border-border bg-surface md:flex">
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <Link href="/design/colors" className="text-lg font-bold text-foreground hover:opacity-80">
          오픈소마
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
        <div className="flex flex-col gap-0.5">
          {foundations.map((item) => {
            const isActive = pathname === item.path
            const IconComponent = item.icon
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  'flex items-center gap-2.5 overflow-hidden rounded-lg py-2 text-sm font-semibold transition-colors',
                  'px-3',
                  isActive
                    ? 'bg-primary-light font-semibold text-primary'
                    : 'text-foreground-muted hover:bg-muted hover:text-foreground',
                )}
              >
                <IconComponent size={18} weight={isActive ? 'fill' : 'regular'} />
                <span className="truncate whitespace-nowrap">{item.label}</span>
              </Link>
            )
          })}
        </div>

        <div className="my-3 h-px bg-border" />

        <div className="flex flex-col gap-0.5">
          {components.map((item) => {
            const isActive = pathname === item.path
            const IconComponent = item.icon
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  'flex items-center gap-2.5 overflow-hidden rounded-lg py-2 text-sm font-semibold transition-colors',
                  'px-3',
                  isActive
                    ? 'bg-primary-light font-semibold text-primary'
                    : 'text-foreground-muted hover:bg-muted hover:text-foreground',
                )}
              >
                <IconComponent size={18} weight={isActive ? 'fill' : 'regular'} />
                <span className="truncate whitespace-nowrap">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="shrink-0 border-t border-border p-3">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={cn(
                'flex flex-1 items-center justify-center rounded-lg py-1.5 text-sm transition-colors',
                theme === t
                  ? 'bg-surface text-foreground shadow-sm'
                  : 'text-foreground-muted hover:text-foreground'
              )}
              aria-label={t === 'light' ? '라이트 모드' : t === 'dark' ? '다크 모드' : '시스템 설정'}
            >
              {t === 'light' ? <Sun size={14} /> : t === 'dark' ? <Moon size={14} /> : <Monitor size={14} />}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
