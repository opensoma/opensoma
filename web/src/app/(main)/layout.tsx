import { Nav } from '~/components/nav'
import { MobileDrawer } from '~/components/mobile-drawer'
import { ShellProvider } from '~/components/shell-context'
import { Sidebar } from '~/components/sidebar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ShellProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Nav />
        <div className="flex flex-1">
          <Sidebar />
          <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
        </div>
        <MobileDrawer />
      </div>
    </ShellProvider>
  )
}
