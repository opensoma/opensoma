import { NavShell } from '~/components/nav-shell'
import { getSession } from '~/lib/session'

export async function Nav() {
  const session = await getSession()

  return <NavShell isLoggedIn={session.isLoggedIn} username={session.username} />
}
