import Link from 'next/link'

import { MobileDrawer } from '@/components/mobile-drawer'
import { MobileMenuButton } from '@/components/mobile-menu-button'
import { ShellProvider } from '@/components/shell-context'
import { Sidebar } from '@/components/sidebar'
import { getCurrentUser } from '@/lib/auth'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  const username = user?.userNm || user?.userId || undefined

  return (
    <ShellProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar username={username} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface px-4 md:hidden">
            <MobileMenuButton />
            <Link href="/dashboard" className="text-lg font-extrabold text-foreground">
              오픈소마
            </Link>
          </header>
          <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
        </div>
        <MobileDrawer username={username} />
      </div>
    </ShellProvider>
  )
}
