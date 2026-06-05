'use client'

import { useQueryState } from 'nuqs'

import type { SomaCampus } from '@/lib/sdk'
import { ToggleGroup, ToggleGroupItem } from '@/ui/toggle-group'

export function ReportFilters({ activeCampus }: { activeCampus: SomaCampus }) {
  const [campus, setCampus] = useQueryState('campus', { shallow: false })

  // Absent `?campus=` means the page defaulted to the active campus — mirror that, not 전체.
  const selected = campus ?? activeCampus

  return (
    <ToggleGroup
      value={selected}
      onValueChange={(next) => {
        setCampus(next || null)
      }}
    >
      <ToggleGroupItem value="seoul">서울</ToggleGroupItem>
      <ToggleGroupItem value="busan">부산</ToggleGroupItem>
      <ToggleGroupItem value="all">전체</ToggleGroupItem>
    </ToggleGroup>
  )
}
