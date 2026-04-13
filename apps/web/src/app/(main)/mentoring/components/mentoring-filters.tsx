'use client'

import { useQueryState } from 'nuqs'

import { ToggleGroup, ToggleGroupItem } from '@/ui/toggle-group'

const typeFilters = [
  { label: '전체', value: '', color: 'bg-foreground-muted' },
  { label: '멘토특강', value: 'lecture', color: 'bg-amber-500' },
  { label: '자유멘토링', value: 'public', color: 'bg-emerald-500' },
]

export function MentoringFilters() {
  const [status, setStatus] = useQueryState('status')
  const [type, setType] = useQueryState('type')
  const [search, setSearch] = useQueryState('search')

  const mineValue = search === 'author:@me' ? 'mine' : 'all'

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <ToggleGroup
          value={status ?? ''}
          onValueChange={(value) => {
            setStatus(value || null)
          }}
        >
          <ToggleGroupItem value="">전체</ToggleGroupItem>
          <ToggleGroupItem value="open">접수중</ToggleGroupItem>
          <ToggleGroupItem value="closed">마감</ToggleGroupItem>
        </ToggleGroup>

        <ToggleGroup
          value={mineValue}
          onValueChange={(value) => {
            setSearch(value === 'mine' ? 'author:@me' : 'all')
          }}
        >
          <ToggleGroupItem value="mine">내 멘토링</ToggleGroupItem>
          <ToggleGroupItem value="all">전체 멘토링</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="flex items-center gap-4">
        {typeFilters.map((item) => (
          <button
            key={item.value}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              type === item.value ? 'font-semibold text-foreground' : 'text-foreground-muted hover:text-foreground'
            }`}
            type="button"
            onClick={() => setType(item.value || null)}
          >
            <span className={`inline-block size-2.5 rounded-full ${item.color}`} />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
