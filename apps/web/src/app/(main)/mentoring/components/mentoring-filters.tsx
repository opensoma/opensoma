'use client'

import { Field } from '@base-ui/react/field'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { useQueryState } from 'nuqs'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'

import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/ui/toggle-group'

const typeFilters = [
  { label: '전체', value: '', color: 'bg-foreground-muted' },
  { label: '멘토특강', value: 'lecture', color: 'bg-amber-500' },
  { label: '자유멘토링', value: 'public', color: 'bg-emerald-500' },
]

const FIELD_OPTIONS = [
  { value: 'title', label: '제목' },
  { value: 'author', label: '작성자' },
  { value: 'content', label: '내용' },
] as const

type FieldKey = (typeof FIELD_OPTIONS)[number]['value']

const MINE_SEARCH = 'author:@me'

function splitSearch(raw: string | null | undefined): { field: FieldKey; value: string } {
  if (!raw || raw === MINE_SEARCH) return { field: 'title', value: '' }
  const colon = raw.indexOf(':')
  if (colon === -1) return { field: 'title', value: raw }
  const candidate = raw.slice(0, colon) as FieldKey
  if (FIELD_OPTIONS.some((option) => option.value === candidate)) {
    return { field: candidate, value: raw.slice(colon + 1) }
  }
  return { field: 'title', value: raw }
}

function joinSearch(field: FieldKey, value: string): string | null {
  if (!value) return null
  return field === 'title' ? value : `${field}:${value}`
}

export function MentoringFilters({ initialSearch }: { initialSearch: string | null }) {
  const [status, setStatus] = useQueryState('status', { shallow: false })
  const [type, setType] = useQueryState('type', { shallow: false })
  const [search, setSearch] = useQueryState('search', { shallow: false })

  const initial = splitSearch(initialSearch)
  const [field, setField] = useState<FieldKey>(initial.field)
  const [value, setValue] = useState(initial.value)

  useEffect(() => {
    const next = splitSearch(initialSearch)
    setField(next.field)
    setValue(next.value)
  }, [initialSearch])

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSearch(joinSearch(field, value.trim()))
  }

  const mineValue = search === MINE_SEARCH ? 'mine' : 'all'
  const hasTextSearch = Boolean(search) && search !== MINE_SEARCH

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <ToggleGroup
            value={status ?? ''}
            onValueChange={(next) => {
              setStatus(next || null)
            }}
          >
            <ToggleGroupItem value="">전체</ToggleGroupItem>
            <ToggleGroupItem value="open">접수중</ToggleGroupItem>
            <ToggleGroupItem value="closed">마감</ToggleGroupItem>
          </ToggleGroup>

          <ToggleGroup
            value={mineValue}
            onValueChange={(next) => {
              setSearch(next === 'mine' ? MINE_SEARCH : 'all')
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

      <form className="flex flex-wrap items-center gap-2" onSubmit={onSubmit}>
        <select
          aria-label="검색 필드"
          className="h-11 rounded-lg border border-border bg-surface px-3 text-sm text-foreground hover:border-border-hover focus:border-primary focus:outline-none"
          value={field}
          onChange={(event) => setField(event.target.value as FieldKey)}
        >
          {FIELD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Field.Root className="w-64">
          <Input
            placeholder="검색어를 입력해주세요"
            value={value}
            onChange={(event) => setValue(event.currentTarget.value)}
          />
        </Field.Root>
        <Button type="submit" variant="secondary">
          <MagnifyingGlass size={16} />
          검색
        </Button>
        {hasTextSearch ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSearch(null)
              setField('title')
              setValue('')
            }}
          >
            초기화
          </Button>
        ) : null}
      </form>
    </div>
  )
}
