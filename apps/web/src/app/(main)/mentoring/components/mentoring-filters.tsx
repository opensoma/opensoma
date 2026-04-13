'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { Checkbox } from '@/ui/checkbox'
import { ToggleGroup, ToggleGroupItem } from '@/ui/toggle-group'

const typeFilters = [
  { label: '전체', value: '', color: 'bg-foreground-muted' },
  { label: '멘토특강', value: 'lecture', color: 'bg-amber-500' },
  { label: '자유멘토링', value: 'public', color: 'bg-emerald-500' },
]

export function MentoringFilters() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentStatus = searchParams.get('status') ?? ''
  const currentType = searchParams.get('type') ?? ''
  const searchParam = searchParams.get('search')
  const isMine = searchParam === 'author:@me' || searchParam === null

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <ToggleGroup
          value={currentStatus}
          onValueChange={(value) =>
            updateSearchParams({
              pathname,
              router,
              searchParams,
              updates: { status: value, page: '' },
            })
          }
        >
          <ToggleGroupItem value="">전체</ToggleGroupItem>
          <ToggleGroupItem value="open">접수중</ToggleGroupItem>
          <ToggleGroupItem value="closed">마감</ToggleGroupItem>
        </ToggleGroup>

        <Checkbox
          checked={isMine}
          onCheckedChange={(checked) =>
            updateSearchParams({
              pathname,
              router,
              searchParams,
              updates: { search: checked ? 'author:@me' : '', page: '' },
            })
          }
        >
          내 멘토링
        </Checkbox>
      </div>

      <div className="flex items-center gap-4">
        {typeFilters.map((item) => (
          <button
            key={item.value}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              currentType === item.value
                ? 'font-semibold text-foreground'
                : 'text-foreground-muted hover:text-foreground'
            }`}
            type="button"
            onClick={() =>
              updateSearchParams({
                pathname,
                router,
                searchParams,
                updates: { type: item.value, page: '' },
              })
            }
          >
            <span className={`inline-block size-2.5 rounded-full ${item.color}`} />
            {item.label}
          </button>
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
