import { MENU_NO } from '../../constants'
import type { UserIdentity } from '../../http'

const SEARCH_FIELD_MAP: Record<string, string> = {
  all: '',
  member: '1',
  mentor: '2',
  project: '3',
  team: '4',
}

export interface TeamSearchQuery {
  field: 'all' | 'member' | 'mentor' | 'project' | 'team'
  value: string
  me?: boolean
}

export function parseTeamSearchQuery(raw: string): TeamSearchQuery {
  const colonIndex = raw.indexOf(':')
  if (colonIndex === -1) {
    return { field: 'all', value: raw }
  }

  const field = raw.slice(0, colonIndex) as TeamSearchQuery['field']
  if (!(field in SEARCH_FIELD_MAP)) {
    return { field: 'all', value: raw }
  }

  const value = raw.slice(colonIndex + 1)
  const me = (field === 'mentor' || field === 'member') && value === '@me'
  return me ? { field, value, me } : { field, value }
}

export function buildTeamListParams(options?: {
  search?: TeamSearchQuery
  user?: UserIdentity
}): Record<string, string> {
  const params: Record<string, string> = { menuNo: MENU_NO.TEAM }

  if (options?.search) {
    if (options.search.me) {
      if (options.user) {
        params.searchCnd = SEARCH_FIELD_MAP[options.search.field]
        params.searchWrd = options.user.userNm
      }
    } else {
      params.searchCnd = SEARCH_FIELD_MAP[options.search.field]
      params.searchWrd = options.search.value
    }
  }

  return params
}
