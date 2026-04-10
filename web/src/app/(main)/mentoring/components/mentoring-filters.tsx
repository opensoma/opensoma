'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { Button } from '~/ui/button'

const statusFilters = [
  { label: '전체', value: '' },
  { label: '접수중', value: 'open' },
  { label: '마감', value: 'closed' },
]

const typeFilters = [
  { label: '전체', value: '' },
  { label: '자유 멘토링', value: 'free' },
  { label: '멘토 특강', value: 'lecture' },
]

export function MentoringFilters() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentStatus = searchParams.get('status') ?? ''
  const currentType = searchParams.get('type') ?? ''

  return (
    <div className="space-y-4 rounded-lg border border-border bg-surface p-4">
      <FilterGroup
        currentValue={currentStatus}
        items={statusFilters}
        label="상태"
        onSelect={(value) =>
          updateSearchParams({ pathname, router, searchParams, updates: { status: value, page: '' } })
        }
      />
      <FilterGroup
        currentValue={currentType}
        items={typeFilters}
        label="유형"
        onSelect={(value) => updateSearchParams({ pathname, router, searchParams, updates: { type: value, page: '' } })}
      />
    </div>
  )
}

function FilterGroup({
  label,
  items,
  currentValue,
  onSelect,
}: {
  label: string
  items: Array<{ label: string; value: string }>
  currentValue: string
  onSelect: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Button
            key={`${label}-${item.value}`}
            size="sm"
            type="button"
            variant={currentValue === item.value ? 'primary' : 'ghost'}
            onClick={() => onSelect(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

function updateSearchParams({
  pathname,
  router,
  searchParams,
  updates,
}: {
  pathname: string
  router: ReturnType<typeof useRouter>
  searchParams: ReturnType<typeof useSearchParams>
  updates: Record<string, string>
}) {
  const next = new URLSearchParams(searchParams.toString())

  Object.entries(updates).forEach(([key, value]) => {
    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
  })

  const query = next.toString()
  router.push(query ? `${pathname}?${query}` : pathname)
}
