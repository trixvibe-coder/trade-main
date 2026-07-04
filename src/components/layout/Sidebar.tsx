import { NavLink, useNavigate } from 'react-router-dom'
import { motion, useAnimation } from 'framer-motion'
import { useEffect, useRef } from 'react'
import {
  LayoutDashboard,
  CandlestickChart,
  LineChart,
  History,
  Wallet,
  User,
  Settings,
  LogOut,
  TrendingUp,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import { formatCurrency } from '../../utils/format'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/trading', label: 'Trading', icon: CandlestickChart },
  { to: '/market', label: 'Market', icon: LineChart },
  { to: '/history', label: 'History', icon: History },
  { to: '/wallet', label: 'Wallet', icon: Wallet },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const { currency } = useSettings()
  const navigate = useNavigate()
  const balanceControls = useAnimation()
  const prevBalanceRef = useRef(user?.balance || 0)

  useEffect(() => {
    const currentBalance = user?.balance || 0
    const prevBalance = prevBalanceRef.current
    if (currentBalance !== prevBalance) {
      const increased = currentBalance > prevBalance
      balanceControls.start({
        scale: [1, 1.08, 1],
        color: increased ? ['#FFFFFF', '#16C784', '#FFFFFF'] : ['#FFFFFF', '#EA3943', '#FFFFFF'],
        transition: { duration: 0.6, ease: 'easeOut' },
      })
      prevBalanceRef.current = currentBalance
    }
  }, [user?.balance, balanceControls])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-surface border-r border-border fixed left-0 top-0 z-30">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
          <TrendingUp size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-text-primary leading-none">TradeFlow</h1>
          <p className="text-xs text-text-secondary mt-1">Trading Simulator</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} className={isActive ? 'text-accent' : ''} />
                <span>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 w-1 h-6 bg-accent rounded-r-full"
                    style={{ marginLeft: '-12px' }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <img src={user?.avatar} alt="avatar" className="w-10 h-10 rounded-full" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">{user?.username}</p>
            <motion.p
              animate={balanceControls}
              className="text-xs text-text-secondary"
            >
              {formatCurrency(user?.balance || 0, currency)}
            </motion.p>
          </div>
        </div>
        <button onClick={handleLogout} className="nav-item w-full text-sell hover:bg-sell/10">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
