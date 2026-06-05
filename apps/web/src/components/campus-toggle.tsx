'use client'

import { Buildings } from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { switchCampus } from '@/lib/actions/switch-campus'
import { cn } from '@/lib/cn'
import type { SomaCampus } from '@/lib/sdk'

const CAMPUS_OPTIONS: { value: SomaCampus; label: string }[] = [
  { value: 'seoul', label: '서울' },
  { value: 'busan', label: '부산' },
]

interface CampusToggleProps {
  activeCampus: SomaCampus
  collapsed?: boolean
}

export function CampusToggle({ activeCampus, collapsed = false }: CampusToggleProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleSwitch(campus: SomaCampus) {
    if (campus === activeCampus || isPending) return
    setError('')
    startTransition(async () => {
      const result = await switchCampus(campus)
      if (result.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  if (collapsed) {
    const next = activeCampus === 'seoul' ? 'busan' : 'seoul'
    const activeLabel = activeCampus === 'seoul' ? '서울' : '부산'
    return (
      <button
        type="button"
        onClick={() => handleSwitch(next)}
        disabled={isPending}
        aria-label={`캠퍼스 전환 (현재 ${activeLabel})`}
        title={`캠퍼스: ${activeLabel}`}
        className="flex w-full items-center justify-center rounded-lg py-2 text-sm font-semibold text-foreground-muted transition-colors hover:bg-muted hover:text-foreground focus:outline-none disabled:opacity-50"
      >
        <Buildings size={18} />
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <div role="radiogroup" aria-label="캠퍼스 선택" className="flex items-center gap-1 rounded-lg bg-muted p-1">
        {CAMPUS_OPTIONS.map((option) => {
          const isActive = option.value === activeCampus
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => handleSwitch(option.value)}
              disabled={isPending}
              className={cn(
                'flex flex-1 items-center justify-center rounded-md px-2 py-1.5 text-xs font-semibold transition-colors focus:outline-none disabled:opacity-50',
                isActive
                  ? 'bg-surface text-foreground shadow-[var(--shadow-elevation-1)]'
                  : 'text-foreground-muted hover:text-foreground',
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      {error ? <p className="px-1 text-xs text-danger-foreground">{error}</p> : null}
    </div>
  )
}
