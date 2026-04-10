'use client'

import { logout } from '~/app/logout/actions'
import { Button } from '~/ui/button'

export function LogoutButton() {
  return (
    <Button variant="ghost" size="sm" onClick={() => logout()}>
      로그아웃
    </Button>
  )
}
