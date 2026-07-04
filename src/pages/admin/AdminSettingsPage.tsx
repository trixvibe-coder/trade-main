import { useNavigate } from 'react-router-dom'
import { LogOut, Globe, Bell, Moon, Shield, Info } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import { Card } from '../../components/ui/Card'
import { Toggle } from '../../components/ui/Controls'
import { Button } from '../../components/ui/Button'
import { PageTransition } from '../../components/ui/PageTransition'
import { showToast } from '../../components/ui/Toast'

export function AdminSettingsPage() {
  const { logout } = useAuth()
  const { notifications, darkTheme, setNotifications, setDarkTheme } = useSettings()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Admin Settings</h1>
          <p className="text-text-secondary text-sm mt-1">Platform configuration</p>
        </div>

        <Card>
          <h2 className="text-base font-bold text-text-primary mb-4">Platform</h2>
          <div className="divide-y divide-border">
            <Toggle
              icon={<Bell size={18} />}
              label="Admin Notifications"
              description="System alerts and updates"
              checked={notifications}
              onChange={(v) => {
                setNotifications(v)
                showToast(v ? 'Notifications enabled' : 'Notifications disabled', 'info')
              }}
            />
            <Toggle
              icon={<Moon size={18} />}
              label="Dark Theme"
              description="Use dark color scheme"
              checked={darkTheme}
              onChange={setDarkTheme}
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-bold text-text-primary mb-4">System Information</h2>
          <div className="space-y-3">
            <InfoRow icon={<Shield size={16} />} label="Platform" value="TradeFlow Simulator" />
            <InfoRow icon={<Info size={16} />} label="Version" value="1.0.0" />
            <InfoRow icon={<Globe size={16} />} label="Environment" value="Local (LocalStorage)" />
          </div>
        </Card>

        <Button variant="danger" fullWidth size="lg" onClick={handleLogout}>
          <LogOut size={18} />
          Logout from Admin
        </Button>
      </div>
    </PageTransition>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div className="flex items-center gap-2 text-text-secondary">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium text-text-primary">{value}</span>
    </div>
  )
}
