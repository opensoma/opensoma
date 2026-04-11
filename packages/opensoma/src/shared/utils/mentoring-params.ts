import { MENU_NO, REPORT_CD } from '../../constants'
import type { UserIdentity } from '../../http'

const STATUS_MAP: Record<string, string> = { open: 'A', closed: 'C' }
const TYPE_MAP: Record<string, string> = {
  public: REPORT_CD.PUBLIC_MENTORING,
  lecture: REPORT_CD.MENTOR_LECTURE,
}
const SEARCH_FIELD_MAP: Record<string, string> = { title: '1', author: '2', content: '3' }

export interface MentoringSearchQuery {
  field: 'title' | 'author' | 'content'
  value: string
  me?: boolean
}

export function parseSearchQuery(raw: string): MentoringSearchQuery {
  const colonIndex = raw.indexOf(':')
  if (colonIndex === -1) {
    return { field: 'title', value: raw }
  }

  const field = raw.slice(0, colonIndex) as MentoringSearchQuery['field']
  if (!(field in SEARCH_FIELD_MAP)) {
    return { field: 'title', value: raw }
  }

  const value = raw.slice(colonIndex + 1)
  const me = field === 'author' && value === '@me'
  return me ? { field, value, me } : { field, value }
}

export function buildMentoringListParams(options?: {
  status?: string
  type?: string
  page?: string | number
  search?: MentoringSearchQuery
  user?: UserIdentity
}): Record<string, string> {
  const params: Record<string, string> = { menuNo: MENU_NO.MENTORING }

  if (options?.status) {
    params.searchStatMentolec = STATUS_MAP[options.status] ?? options.status
  }

  if (options?.search) {
    params.searchCnd = SEARCH_FIELD_MAP[options.search.field]
    if (options.search.me && options.user) {
      params.searchId = options.user.userId
      params.searchWrd = options.user.userNm
    } else {
      params.searchWrd = options.search.value
    }
  }

  if (options?.type) params.searchGubunMentolec = TYPE_MAP[options.type] ?? options.type
  if (options?.page) params.pageIndex = String(options.page)

  return params
}
