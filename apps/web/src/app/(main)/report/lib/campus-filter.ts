import type { SomaCampus } from '@/lib/sdk'

export type CampusSelection = SomaCampus | 'all'

export function resolveCampusSelection(param: string | undefined, activeCampus: SomaCampus): CampusSelection {
  if (param === 'all' || param === 'seoul' || param === 'busan') return param
  return activeCampus
}

export function selectionToCampus(selection: CampusSelection): SomaCampus | undefined {
  return selection === 'all' ? undefined : selection
}
