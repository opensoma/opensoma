import { MobileDrawer } from '@/components/mobile-drawer'
import { MobileMenuButton } from '@/components/mobile-menu-button'
import { ShellProvider } from '@/components/shell-context'
import { Sidebar } from '@/components/sidebar'
import { getAuthState } from '@/lib/auth'
import { UserGb } from '@/lib/sdk'
import { readActiveCampus } from '@/lib/session'
import Link from '@/ui/link'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = await getAuthState()
  const username = user?.userNm || user?.userId || undefined
  const isTrainee = user?.userGb === UserGb.Trainee
  const activeCampus = await readActiveCampus()

  return (
    <ShellProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar
          isAuthenticated={isAuthenticated}
          isTrainee={isTrainee}
          username={username}
          activeCampus={activeCampus}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface px-4 md:hidden">
            <MobileMenuButton />
            <Link href="/dashboard" className="text-lg font-extrabold text-foreground">
              오픈소마
            </Link>
          </header>
          <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
        </div>
        <MobileDrawer
          isAuthenticated={isAuthenticated}
          isTrainee={isTrainee}
          username={username}
          activeCampus={activeCampus}
        />
      </div>
    </ShellProvider>
  )
}
