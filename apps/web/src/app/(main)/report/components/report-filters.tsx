'use client'

import { useQueryState } from 'nuqs'

import type { CampusSelection } from '@/app/(main)/report/lib/campus-filter'
import { ToggleGroup, ToggleGroupItem } from '@/ui/toggle-group'

export function ReportFilters({ selection }: { selection: CampusSelection }) {
  const [, setCampus] = useQueryState('campus', { shallow: false })

  return (
    <ToggleGroup
      value={selection}
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
