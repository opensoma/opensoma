const SWMAESTRO_HOSTS = ['www.swmaestro.ai', 'swmaestro.ai']

export function isSwmaestroUrl(url: string): boolean {
  try {
    const parsed = new URL(url, 'https://www.swmaestro.ai')
    return SWMAESTRO_HOSTS.includes(parsed.hostname)
  } catch {
    return false
  }
}

export function convertSwmaestroUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return url
  }

  let parsed: URL
  try {
    parsed = new URL(url, 'https://www.swmaestro.ai')
  } catch {
    return url
  }

  if (!SWMAESTRO_HOSTS.includes(parsed.hostname)) {
    return url
  }

  return convertSwmaestroPath(parsed.pathname, parsed.searchParams)
}

function convertSwmaestroPath(pathname: string, searchParams: URLSearchParams): string {
  if (pathname.includes('/mentoLec/view.do')) {
    const id = searchParams.get('qustnrSn')
    if (id) return `/mentoring/${id}`
  }

  if (pathname.includes('/mentoLec/list.do')) {
    return '/mentoring'
  }

  if (pathname.includes('/myNotice/view.do')) {
    const id = searchParams.get('nttId')
    if (id) return `/notice/${id}`
  }

  if (pathname.includes('/myNotice/list.do')) {
    return '/notice'
  }

  if (pathname.includes('/applicants/view.do')) {
    const id = searchParams.get('bbsId')
    if (id) return `/event/${id}`
  }

  if (pathname.includes('/applicants/list.do')) {
    return '/event'
  }

  if (pathname.includes('/schedule/list.do')) {
    return '/schedule'
  }

  if (pathname.includes('/itemRent/') || pathname.includes('/officeMng/')) {
    return '/room'
  }

  if (pathname.includes('/myTeam/team.do')) {
    return '/team'
  }

  if (pathname.includes('/myInfo/') && pathname.includes('Update')) {
    return '/member'
  }

  if (pathname.includes('/myMain/dashboard.do')) {
    return '/'
  }

  return urlFromPathAndParams(pathname, searchParams)
}

function urlFromPathAndParams(pathname: string, searchParams: URLSearchParams): string {
  const query = searchParams.toString()
  return query ? `${pathname}?${query}` : pathname
}
