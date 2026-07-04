import { type ReactNode, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  SlidersHorizontal,
  ArrowLeftRight,
  Settings,
  LogOut,
  TrendingUp,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const adminNavItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/market', label: 'Market Control', icon: SlidersHorizontal },
  { to: '/admin/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export function AdminLayout({ children }: { children: ReactNode }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  const sidebarContent = (
    <>
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
          <TrendingUp size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-text-primary leading-none">TradeFlow</h1>
          <p className="text-xs text-accent mt-1">Admin Panel</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
        {adminNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} className={isActive ? 'text-accent' : ''} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <button onClick={handleLogout} className="nav-item w-full text-sell hover:bg-sell/10">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-background">
      <aside className="hidden lg:flex flex-col w-64 h-screen bg-surface border-r border-border fixed left-0 top-0 z-30">
        {sidebarContent}
      </aside>

      <div className="lg:hidden sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <TrendingUp size={18} className="text-white" />
          </div>
          <span className="text-base font-bold text-text-primary">Admin Panel</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="text-text-primary p-2">
          <Menu size={22} />
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-surface border-r border-border z-50 flex flex-col"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 text-text-secondary p-2"
              >
                <X size={20} />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:ml-64">
        <main className="px-4 py-4 lg:px-8 lg:py-6 min-h-screen">{children}</main>
      </div>
    </div>
  )
}
