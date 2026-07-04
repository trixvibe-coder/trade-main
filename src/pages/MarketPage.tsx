import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Star, TrendingUp, TrendingDown } from 'lucide-react'
import { useMarket } from '../context/MarketContext'
import { useSettings } from '../context/SettingsContext'
import { Input } from '../components/ui/Input'
import { SegmentedControl } from '../components/ui/Controls'
import { MiniChart } from '../components/MiniChart'
import { PageTransition } from '../components/ui/PageTransition'
import { formatCurrency, formatPercent } from '../utils/format'
import type { AssetCategory } from '../types'

type Filter = 'all' | AssetCategory | 'favorites'

export function MarketPage() {
  const { assets, candles, toggleFavorite } = useMarket()
  const { currency } = useSettings()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const filteredAssets = useMemo(() => {
    let result = assets
    if (filter === 'favorites') {
      result = result.filter((a) => a.favorites.includes(a.symbol))
    } else if (filter !== 'all') {
      result = result.filter((a) => a.category === filter)
    }
    if (search) {
      const lower = search.toLowerCase()
      result = result.filter(
        (a) => a.symbol.toLowerCase().includes(lower) || a.name.toLowerCase().includes(lower),
      )
    }
    return result
  }, [assets, filter, search])

  return (
    <PageTransition>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Market</h1>
          <p className="text-text-secondary text-sm mt-1">Trade crypto, forex, and commodities</p>
        </div>

        <Input
          placeholder="Search assets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search size={18} />}
        />

        <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
          <SegmentedControl
            options={[
              { label: 'All', value: 'all' },
              { label: 'Crypto', value: 'crypto' },
              { label: 'Forex', value: 'forex' },
              { label: 'Commodities', value: 'commodity' },
              { label: 'Favorites', value: 'favorites' },
            ]}
            value={filter}
            onChange={(v) => setFilter(v as Filter)}
          />
        </div>

        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredAssets.map((asset) => {
              const assetCandles = candles[asset.symbol] || []
              const isFavorite = asset.favorites.includes(asset.symbol)
              const isPositive = asset.dailyChangePercent >= 0

              return (
                <motion.div
                  key={asset.symbol}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => navigate(`/trading?symbol=${asset.symbol}`)}
                  className="card p-4 flex items-center gap-3 cursor-pointer hover:border-accent/20 transition-colors"
                >
                  <div className="w-11 h-11 rounded-xl bg-surface flex items-center justify-center text-base font-bold text-text-primary flex-shrink-0">
                    {asset.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-primary">{asset.symbol}</p>
                    <p className="text-xs text-text-secondary truncate">{asset.name}</p>
                  </div>

                  <div className="hidden sm:block">
                    <MiniChart candles={assetCandles} positive={isPositive} width={80} height={36} />
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-text-primary">
                      {formatCurrency(asset.currentPrice, currency)}
                    </p>
                    <div className="flex items-center justify-end gap-1">
                      {isPositive ? (
                        <TrendingUp size={12} className="text-buy" />
                      ) : (
                        <TrendingDown size={12} className="text-sell" />
                      )}
                      <span className={`text-xs font-medium ${isPositive ? 'text-buy' : 'text-sell'}`}>
                        {formatPercent(asset.dailyChangePercent)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(asset.symbol)
                    }}
                    className="p-2 -mr-1 text-text-secondary hover:text-yellow-500 transition-colors"
                  >
                    <Star size={18} fill={isFavorite ? 'currentColor' : 'none'} className={isFavorite ? 'text-yellow-500' : ''} />
                  </button>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {filteredAssets.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-text-secondary text-sm">No assets found</p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
