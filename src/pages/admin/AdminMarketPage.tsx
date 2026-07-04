import { motion } from 'framer-motion'
import { Play, Pause, Shuffle, TrendingUp, TrendingDown, Activity, Gauge, Zap, RotateCcw } from 'lucide-react'
import { useMarket } from '../../context/MarketContext'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { showToast } from '../../components/ui/Toast'
import { PageTransition } from '../../components/ui/PageTransition'
import type { MarketMode } from '../../types'

export function AdminMarketPage() {
  const { settings, updateSettings, setMode, setStatus, assets, resetAssetPrice } = useMarket()

  const handleStatusToggle = () => {
    const newStatus = settings.status === 'running' ? 'paused' : 'running'
    setStatus(newStatus)
    showToast(`Market ${newStatus}`, newStatus === 'running' ? 'success' : 'info')
  }

  const handleModeChange = (mode: MarketMode) => {
    setMode(mode)
    showToast(`Mode: ${mode}`, 'info')
  }

  const handleReset = () => {
    updateSettings({
      mode: 'random',
      speed: 50,
      trendStrength: 50,
      volatility: 50,
    })
    showToast('Market settings reset', 'success')
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Market Control</h1>
            <p className="text-text-secondary text-sm mt-1">Control the trading simulation in real-time</p>
          </div>
          <Button onClick={handleStatusToggle} variant={settings.status === 'running' ? 'sell' : 'buy'} size="lg">
            {settings.status === 'running' ? <Pause size={18} /> : <Play size={18} />}
            {settings.status === 'running' ? 'Pause Market' : 'Start Market'}
          </Button>
        </div>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-text-primary">Market Status</h2>
            <Badge variant={settings.status === 'running' ? 'success' : 'warning'}>
              {settings.status === 'running' ? 'Running' : 'Paused'}
            </Badge>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-surface border border-border">
              <p className="text-xs text-text-secondary mb-1">Mode</p>
              <p className="text-sm font-bold text-text-primary capitalize">{settings.mode}</p>
            </div>
            <div className="p-3 rounded-xl bg-surface border border-border">
              <p className="text-xs text-text-secondary mb-1">Speed</p>
              <p className="text-sm font-bold text-text-primary">{settings.speed}%</p>
            </div>
            <div className="p-3 rounded-xl bg-surface border border-border">
              <p className="text-xs text-text-secondary mb-1">Volatility</p>
              <p className="text-sm font-bold text-text-primary">{settings.volatility}%</p>
            </div>
            <div className="p-3 rounded-xl bg-surface border border-border">
              <p className="text-xs text-text-secondary mb-1">Trend Strength</p>
              <p className="text-sm font-bold text-text-primary">{settings.trendStrength}%</p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-bold text-text-primary mb-4">Market Mode</h2>
          <div className="grid grid-cols-3 gap-3">
            <ModeButton
              icon={<Shuffle size={20} />}
              label="Random"
              active={settings.mode === 'random'}
              onClick={() => handleModeChange('random')}
              color="default"
            />
            <ModeButton
              icon={<TrendingUp size={20} />}
              label="Uptrend"
              active={settings.mode === 'uptrend'}
              onClick={() => handleModeChange('uptrend')}
              color="buy"
            />
            <ModeButton
              icon={<TrendingDown size={20} />}
              label="Downtrend"
              active={settings.mode === 'downtrend'}
              onClick={() => handleModeChange('downtrend')}
              color="sell"
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-bold text-text-primary mb-4">Market Parameters</h2>
          <div className="space-y-5">
            <SliderControl
              icon={<Gauge size={18} />}
              label="Market Speed"
              description="Controls how fast prices update (50-150ms interval)"
              value={settings.speed}
              onChange={(v) => updateSettings({ speed: v })}
            />
            <SliderControl
              icon={<Zap size={18} />}
              label="Volatility"
              description="Controls price movement magnitude"
              value={settings.volatility}
              onChange={(v) => updateSettings({ volatility: v })}
            />
            <SliderControl
              icon={<Activity size={18} />}
              label="Trend Strength"
              description="Controls how strong the trend force is"
              value={settings.trendStrength}
              onChange={(v) => updateSettings({ trendStrength: v })}
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-text-primary">Asset Prices</h2>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw size={14} />
              Reset Settings
            </Button>
          </div>
          <div className="space-y-2">
            {assets.map((asset) => (
              <div key={asset.symbol} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-card flex items-center justify-center text-sm font-bold text-text-primary">
                    {asset.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{asset.symbol}</p>
                    <p className="text-xs text-text-secondary">{asset.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-bold text-text-primary">{asset.currentPrice.toFixed(asset.currentPrice < 1 ? 5 : 2)}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      resetAssetPrice(asset.symbol, asset.basePrice)
                      showToast(`${asset.symbol} price reset`, 'success')
                    }}
                  >
                    <RotateCcw size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageTransition>
  )
}

function ModeButton({
  icon,
  label,
  active,
  onClick,
  color,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
  color: 'buy' | 'sell' | 'default'
}) {
  const colorClasses = {
    buy: 'border-buy/30 bg-buy/10 text-buy',
    sell: 'border-sell/30 bg-sell/10 text-sell',
    default: 'border-accent/30 bg-accent/10 text-accent',
  }

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
        active ? colorClasses[color] : 'bg-surface border-border text-text-secondary hover:text-text-primary'
      }`}
    >
      {icon}
      <span className="text-sm font-semibold">{label}</span>
    </motion.button>
  )
}

function SliderControl({
  icon,
  label,
  description,
  value,
  onChange,
}: {
  icon: React.ReactNode
  label: string
  description: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-text-secondary">{icon}</span>
          <div>
            <p className="text-sm font-medium text-text-primary">{label}</p>
            <p className="text-xs text-text-secondary">{description}</p>
          </div>
        </div>
        <span className="text-sm font-bold text-accent">{value}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-accent"
        style={{
          background: `linear-gradient(to right, #3B82F6 ${value}%, #121820 ${value}%)`,
        }}
      />
    </div>
  )
}
