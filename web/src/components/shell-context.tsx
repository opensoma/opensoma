'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

interface ShellContextValue {
  isSidebarCollapsed: boolean
  isMobileDrawerOpen: boolean
  setIsMobileDrawerOpen: (open: boolean) => void
  toggleMobileDrawer: () => void
  toggleSidebarCollapsed: () => void
}

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed'

const ShellContext = createContext<ShellContextValue | null>(null)

export function ShellProvider({ children }: { children: ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)
  const [hasLoadedPreference, setHasLoadedPreference] = useState(false)

  useEffect(() => {
    const storedValue = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY)

    if (storedValue !== null) {
      setIsSidebarCollapsed(storedValue === 'true')
    }

    setHasLoadedPreference(true)
  }, [])

  useEffect(() => {
    if (!hasLoadedPreference) {
      return
    }

    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isSidebarCollapsed))
  }, [hasLoadedPreference, isSidebarCollapsed])

  const value = useMemo<ShellContextValue>(
    () => ({
      isSidebarCollapsed,
      isMobileDrawerOpen,
      setIsMobileDrawerOpen,
      toggleMobileDrawer: () => setIsMobileDrawerOpen((current) => !current),
      toggleSidebarCollapsed: () => setIsSidebarCollapsed((current) => !current),
    }),
    [isMobileDrawerOpen, isSidebarCollapsed],
  )

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>
}

export function useShell() {
  const context = useContext(ShellContext)

  if (!context) {
    throw new Error('useShell must be used within ShellProvider')
  }

  return context
}
