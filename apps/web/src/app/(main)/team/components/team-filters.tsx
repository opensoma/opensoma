'use client'

import { Field } from '@base-ui/react/field'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { useQueryState } from 'nuqs'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'

import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/ui/toggle-group'

const FIELD_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'team', label: '팀명' },
  { value: 'member', label: '연수생명' },
  { value: 'mentor', label: '멘토명' },
  { value: 'project', label: '프로젝트명' },
] as const

type FieldKey = (typeof FIELD_OPTIONS)[number]['value']
type MineSearch = 'mentor:@me' | 'member:@me'

function splitSearch(raw: string | null | undefined): { field: FieldKey; value: string } {
  if (!raw) return { field: 'all', value: '' }
  const colon = raw.indexOf(':')
  if (colon === -1) return { field: 'all', value: raw }
  const candidate = raw.slice(0, colon) as FieldKey
  if (FIELD_OPTIONS.some((option) => option.value === candidate)) {
    return { field: candidate, value: raw.slice(colon + 1) }
  }
  return { field: 'all', value: raw }
}

function joinSearch(field: FieldKey, value: string): string | null {
  if (!value) return null
  return field === 'all' ? value : `${field}:${value}`
}

export function TeamFilters({ initialSearch, mineSearch }: { initialSearch: string | null; mineSearch: MineSearch }) {
  const [, setSearch] = useQueryState('search', { shallow: false, history: 'push' })
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

  const mineValue = initialSearch === mineSearch ? 'mine' : 'all'

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <ToggleGroup
        value={mineValue}
        onValueChange={(next) => {
          setSearch(next === 'mine' ? mineSearch : null)
        }}
      >
        <ToggleGroupItem value="mine">내 팀</ToggleGroupItem>
        <ToggleGroupItem value="all">전체 팀</ToggleGroupItem>
      </ToggleGroup>

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
        {initialSearch ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSearch(null)
              setField('all')
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
