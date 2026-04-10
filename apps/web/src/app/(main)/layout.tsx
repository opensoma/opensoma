import Link from 'next/link'

import { MobileDrawer } from '@/components/mobile-drawer'
import { MobileMenuButton } from '@/components/mobile-menu-button'
import { ShellProvider } from '@/components/shell-context'
import { Sidebar } from '@/components/sidebar'
import { getSession } from '@/lib/session'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  return (
    <ShellProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar username={session.isLoggedIn ? session.username : undefined} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface px-4 md:hidden">
            <Link href="/" className="text-lg font-extrabold text-foreground">
              오픈소마
            </Link>
            <MobileMenuButton />
          </header>
          <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
        </div>
        <MobileDrawer username={session.isLoggedIn ? session.username : undefined} />
      </div>
    </ShellProvider>
  )
}
