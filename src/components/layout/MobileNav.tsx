import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, CandlestickChart, LineChart, History, Wallet } from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/trading', label: 'Trade', icon: CandlestickChart },
  { to: '/market', label: 'Market', icon: LineChart },
  { to: '/history', label: 'History', icon: History },
  { to: '/wallet', label: 'Wallet', icon: Wallet },
]

export function MobileNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface/95 backdrop-blur-md border-t border-border safe-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors ${
                isActive ? 'text-accent' : 'text-text-secondary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-active"
                    className="absolute inset-0 bg-accent/10 rounded-xl"
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  />
                )}
                <item.icon size={22} className="relative z-10" />
                <span className="text-[10px] font-medium relative z-10">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
