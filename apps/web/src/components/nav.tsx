import { NavShell } from '@/components/nav-shell'
import { getCurrentUser } from '@/lib/auth'

export async function Nav() {
  const user = await getCurrentUser()

  return <NavShell isLoggedIn={user !== null} username={user?.userNm || user?.userId || ''} />
}
