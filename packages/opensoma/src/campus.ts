export const DEFAULT_SOMA_CAMPUS = 'seoul'
export type SomaCampus = 'seoul' | 'busan'

export class InvalidSomaCampusError extends Error {
  constructor(value: string) {
    super(`Invalid SWMaestro campus: ${value}. Expected "seoul" or "busan".`)
    this.name = 'InvalidSomaCampusError'
  }
}

export function parseSomaCampus(value: string | null | undefined): SomaCampus {
  const normalized = value?.trim().toLowerCase()
  if (!normalized) {
    return DEFAULT_SOMA_CAMPUS
  }

  switch (normalized) {
    case 'seoul':
    case 's':
    case '서울':
      return 'seoul'
    case 'busan':
    case 'b':
    case '부산':
      return 'busan'
    default:
      throw new InvalidSomaCampusError(value ?? '')
  }
}

export function getSomaBaseUrl(campus: SomaCampus = DEFAULT_SOMA_CAMPUS): string {
  switch (campus) {
    case 'seoul':
      return 'https://www.swmaestro.ai/sw'
    case 'busan':
      return 'https://www.swmaestro.ai/busan/sw'
  }
}

export function buildSomaUrl(path: string, params: Record<string, string> | undefined, campus: SomaCampus): string {
  const normalizedPath = stripSomaBasePath(path).replace(/^\//, '')
  const url = new URL(normalizedPath, `${getSomaBaseUrl(campus)}/`)

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
  }

  return url.toString()
}

export function stripSomaBasePath(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  const busanPrefix = '/busan/sw'
  const seoulPrefix = '/sw'

  if (normalized === busanPrefix || normalized.startsWith(`${busanPrefix}/`)) {
    return normalized.slice(busanPrefix.length) || '/'
  }
  if (normalized === seoulPrefix || normalized.startsWith(`${seoulPrefix}/`)) {
    return normalized.slice(seoulPrefix.length) || '/'
  }
  return normalized
}
