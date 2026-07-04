import { type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { TopBar } from './TopBar'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/trading': 'Trading',
  '/market': 'Market',
  '/history': 'History',
  '/wallet': 'Wallet',
  '/profile': 'Profile',
  '/settings': 'Settings',
}

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'TradeFlow'

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <TopBar title={title} />
        <main className="px-4 py-4 pb-24 lg:px-8 lg:py-6 lg:pb-8 min-h-screen">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
