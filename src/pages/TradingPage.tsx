import { useEffect, useRef, useState, useMemo, memo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Clock,
  ChevronDown,
  Activity,
  Zap,
  Layers,
} from 'lucide-react'
import {
  createChart,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts'
import { useMarket } from '../context/MarketContext'
import { useAuth } from '../context/AuthContext'
import { useTrade } from '../context/TradeContext'
import { useSettings } from '../context/SettingsContext'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { SegmentedControl } from '../components/ui/Controls'
import { showToast } from '../components/ui/Toast'
import { PageTransition } from '../components/ui/PageTransition'
import { TRADE_DURATIONS, PROFIT_PERCENTAGES } from '../constants'
import { formatCurrency, formatPercent, formatCountdown, formatDateTime } from '../utils/format'
import { TradeMarkerManager } from '../engine/chartMarkers'
import {
  isTradeExpired,
  getRemainingSeconds,
  getProgressPercent,
  getFloatingPnl,
  isWinning,
} from '../engine/tradeService'
import type { Trade, TradeDirection } from '../types'

export function TradingPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const symbol = searchParams.get('symbol') || 'BTC/USD'
  const { assets, candles, getAsset, getCandles } = useMarket()
  const { user } = useAuth()
  const { openTrade, settleTradeById, trades: allTrades } = useTrade()
  const { currency } = useSettings()

  const [investment, setInvestment] = useState('100')
  const [duration, setDuration] = useState(60)
  const [profitPercent, setProfitPercent] = useState(85)
  const [showAssetModal, setShowAssetModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingDirection, setPendingDirection] = useState<TradeDirection | null>(null)
  const [activeTab, setActiveTab] = useState<'positions' | 'history'>('positions')

  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const lastCandleKeyRef = useRef<string>('')
  const markerManagerRef = useRef<TradeMarkerManager | null>(null)
  const processedTradesRef = useRef<Set<string>>(new Set())
  const notifiedTradesRef = useRef<Set<string>>(new Set())
  const rafRef = useRef<number>(0)

  const asset = getAsset(symbol) || assets[0]
  const assetCandles = getCandles(symbol)

  const userTrades = useMemo(
    () => (user ? allTrades.filter((t) => t.userId === user.id) : []),
    [allTrades, user],
  )
  const openPositions = useMemo(
    () => userTrades.filter((t) => t.status === 'open' && t.symbol === symbol),
    [userTrades, symbol],
  )
  const closedTrades = useMemo(
    () => userTrades.filter((t) => t.status !== 'open' && t.symbol === symbol).slice(0, 10),
    [userTrades, symbol],
  )

  const investmentNum = parseFloat(investment) || 0
  const potentialProfit = (investmentNum * profitPercent) / 100

  const assetRef = useRef(asset)
  assetRef.current = asset

  const openPositionsRef = useRef(openPositions)
  openPositionsRef.current = openPositions

  const userTradesRef = useRef(userTrades)
  userTradesRef.current = userTrades

  const settleTradeByIdRef = useRef(settleTradeById)
  settleTradeByIdRef.current = settleTradeById

  const currencyRef = useRef(currency)
  currencyRef.current = currency

  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#181F2A' },
        textColor: '#9CA3AF',
        fontFamily: 'Inter, sans-serif',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.03)' },
        horzLines: { color: 'rgba(255,255,255,0.03)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(255,255,255,0.1)', labelBackgroundColor: '#3B82F6' },
        horzLine: { color: 'rgba(255,255,255,0.1)', labelBackgroundColor: '#3B82F6' },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        timeVisible: true,
        secondsVisible: true,
      },
      handleScale: true,
      handleScroll: true,
    })

    const series = chart.addCandlestickSeries({
      upColor: '#16C784',
      downColor: '#EA3943',
      borderUpColor: '#16C784',
      borderDownColor: '#EA3943',
      wickUpColor: '#16C784',
      wickDownColor: '#EA3943',
    })

    chartRef.current = chart
    seriesRef.current = series
    markerManagerRef.current = new TradeMarkerManager(chart, series, chartContainerRef.current)

    const resizeObserver = new ResizeObserver(() => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        })
        markerManagerRef.current?.updatePositions()
      }
    })
    resizeObserver.observe(chartContainerRef.current)

    const onRangeChange = () => markerManagerRef.current?.updatePositions()
    chart.timeScale().subscribeVisibleLogicalRangeChange(onRangeChange)

    return () => {
      resizeObserver.disconnect()
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(onRangeChange)
      markerManagerRef.current?.clearAll()
      markerManagerRef.current = null
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [])

  const firstCandleTime = assetCandles.length > 0 ? assetCandles[0].time : 0

  useEffect(() => {
    if (!seriesRef.current || assetCandles.length === 0) return

    const chartData = assetCandles.map((c) => ({
      time: c.time as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }))

    seriesRef.current.setData(chartData)
    const lastCandle = assetCandles[assetCandles.length - 1]
    lastCandleKeyRef.current = lastCandle.time + ':' + lastCandle.close
    chartRef.current?.timeScale().scrollToRealTime()
    requestAnimationFrame(() => markerManagerRef.current?.updatePositions())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, firstCandleTime])

  useEffect(() => {
    if (!seriesRef.current || assetCandles.length === 0) return
    const lastCandle = assetCandles[assetCandles.length - 1]
    if (!lastCandle) return

    const candleKey = lastCandle.time + ':' + lastCandle.close
    if (candleKey === lastCandleKeyRef.current) return

    lastCandleKeyRef.current = candleKey

    seriesRef.current.update({
      time: lastCandle.time as UTCTimestamp,
      open: lastCandle.open,
      high: lastCandle.high,
      low: lastCandle.low,
      close: lastCandle.close,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetCandles])

  useEffect(() => {
    if (!markerManagerRef.current) return
    const currencySymbol = getCurrencySymbol(currencyRef.current)
    for (const trade of openPositionsRef.current) {
      if (!markerManagerRef.current.hasMarker(trade.id)) {
        markerManagerRef.current.addTrade(trade, currencySymbol)
      }
    }
  }, [openPositions])

  useEffect(() => {
    if (!markerManagerRef.current) return
    const cur = currencyRef.current

    for (const trade of userTradesRef.current) {
      if (trade.status === 'open') continue
      if (notifiedTradesRef.current.has(trade.id)) continue

      notifiedTradesRef.current.add(trade.id)

      if (markerManagerRef.current.hasMarker(trade.id)) {
        markerManagerRef.current.setResult(trade.id, trade.status as 'win' | 'loss' | 'draw')
      }

      if (trade.status === 'win') {
        showToast(`${trade.symbol} — WIN +${formatCurrency(trade.payout - trade.investment, cur)}`, 'success')
      } else if (trade.status === 'loss') {
        showToast(`${trade.symbol} — LOSE -${formatCurrency(trade.investment, cur)}`, 'error')
      } else if (trade.status === 'draw') {
        showToast(`${trade.symbol} — DRAW (refunded)`, 'info')
      }
    }
  }, [userTrades])

  useEffect(() => {
    const loop = () => {
      const now = Date.now()
      const currentAsset = assetRef.current
      const positions = openPositionsRef.current

      for (const trade of positions) {
        if (trade.status !== 'open') continue

        const remaining = getRemainingSeconds(trade, now)
        markerManagerRef.current?.updateTimer(trade.id, remaining)

        if (isTradeExpired(trade, now)) {
          if (processedTradesRef.current.has(trade.id)) continue
          processedTradesRef.current.add(trade.id)

          const exitPrice = currentAsset?.currentPrice ?? trade.entryPrice
          settleTradeByIdRef.current(trade.id, exitPrice)
        }
      }

      markerManagerRef.current?.updatePositions()
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const handleTradeClick = (direction: TradeDirection) => {
    if (!user) return
    if (investmentNum <= 0) {
      showToast('Enter a valid investment amount', 'error')
      return
    }
    if (investmentNum > user.balance) {
      showToast('Insufficient balance', 'error')
      return
    }
    setPendingDirection(direction)
    setShowConfirmModal(true)
  }

  const confirmTrade = () => {
    if (!user || !asset || !pendingDirection) return

    const trade = openTrade({
      symbol: asset.symbol,
      assetName: asset.name,
      direction: pendingDirection,
      investment: investmentNum,
      profitPercent,
      entryPrice: asset.currentPrice,
      duration,
    })

    setShowConfirmModal(false)
    if (trade) {
      showToast(`${pendingDirection} order placed`, 'success')
      setActiveTab('positions')
    } else {
      showToast('Failed to place trade', 'error')
    }
    setPendingDirection(null)
  }

  if (!asset) {
    return (
      <PageTransition>
        <div className="py-20 text-center">
          <p className="text-text-secondary">Loading market data...</p>
        </div>
      </PageTransition>
    )
  }

  const isPositive = asset.dailyChangePercent >= 0

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowAssetModal(true)}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-base font-bold text-text-primary">
              {asset.icon}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1">
                <p className="text-base font-bold text-text-primary">{asset.symbol}</p>
                <ChevronDown size={16} className="text-text-secondary" />
              </div>
              <p className="text-xs text-text-secondary">{asset.name}</p>
            </div>
          </button>

          <div className="text-right">
            <motion.p
              key={Math.floor(asset.currentPrice * 100)}
              initial={{ scale: 0.97, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.15 }}
              className={`text-lg font-bold ${isPositive ? 'text-buy' : 'text-sell'}`}
            >
              {formatCurrency(asset.currentPrice, currency)}
            </motion.p>
            <p className={`text-xs font-medium ${isPositive ? 'text-buy' : 'text-sell'}`}>
              {formatPercent(asset.dailyChangePercent)}
            </p>
          </div>
        </div>

        <div className="card p-1 overflow-hidden relative">
          <div ref={chartContainerRef} className="h-[280px] sm:h-[360px] lg:h-[440px]" />
        </div>

        {openPositions.length > 0 && (
          <OpenTradesPanel
            trades={openPositions}
            currentPrice={asset.currentPrice}
            currency={currency}
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">Investment</label>
            <div className="relative">
              <input
                type="number"
                value={investment}
                onChange={(e) => setInvestment(e.target.value)}
                className="input-field w-full pr-12"
                placeholder="100"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-secondary font-medium">
                {getCurrencySymbol(currency)}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">Profit Rate</label>
            <div className="input-field flex items-center justify-between cursor-pointer">
              <span className="text-text-primary font-semibold">{profitPercent}%</span>
              <div className="flex gap-1">
                {PROFIT_PERCENTAGES.map((p) => (
                  <button
                    key={p}
                    onClick={() => setProfitPercent(p)}
                    className={`px-2 py-0.5 text-xs rounded-md font-medium transition-colors ${
                      profitPercent === p ? 'bg-accent text-white' : 'bg-card text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-2">Duration</label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {TRADE_DURATIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDuration(d.value)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-shrink-0 ${
                  duration === d.value
                    ? 'bg-accent text-white'
                    : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-accent" />
            <span className="text-sm text-text-secondary">Potential Profit</span>
          </div>
          <span className="text-sm font-bold text-buy">
            +{formatCurrency(potentialProfit, currency)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="buy" size="lg" fullWidth onClick={() => handleTradeClick('BUY')}>
            <TrendingUp size={20} />
            BUY
          </Button>
          <Button variant="sell" size="lg" fullWidth onClick={() => handleTradeClick('SELL')}>
            <TrendingDown size={20} />
            SELL
          </Button>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-accent" />
              <h2 className="text-base font-bold text-text-primary">My Trades</h2>
            </div>
            <SegmentedControl
              options={[
                { label: 'Positions', value: 'positions' },
                { label: 'History', value: 'history' },
              ]}
              value={activeTab}
              onChange={(v) => setActiveTab(v as 'positions' | 'history')}
            />
          </div>

          {activeTab === 'positions' ? (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {openPositions.length === 0 ? (
                  <motion.div
                    key="empty-positions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-8 text-center"
                  >
                    <p className="text-text-secondary text-sm">No open positions</p>
                  </motion.div>
                ) : (
                  openPositions.map((trade) => (
                    <PositionRow
                      key={trade.id}
                      trade={trade}
                      currentPrice={asset.currentPrice}
                      currency={currency}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-2">
              {closedTrades.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-text-secondary text-sm">No trade history</p>
                </div>
              ) : (
                closedTrades.map((trade) => (
                  <HistoryRow key={trade.id} trade={trade} currency={currency} />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <Modal open={showAssetModal} onClose={() => setShowAssetModal(false)} title="Select Asset">
        <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
          {assets.map((a) => (
            <button
              key={a.symbol}
              onClick={() => {
                setSearchParams({ symbol: a.symbol })
                setShowAssetModal(false)
              }}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                a.symbol === symbol ? 'bg-accent/10 border border-accent/30' : 'bg-surface border border-border hover:border-border/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-card flex items-center justify-center text-sm font-bold text-text-primary">
                  {a.icon}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-text-primary">{a.symbol}</p>
                  <p className="text-xs text-text-secondary">{a.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-text-primary">
                  {formatCurrency(a.currentPrice, currency)}
                </p>
                <p className={`text-xs font-medium ${a.dailyChangePercent >= 0 ? 'text-buy' : 'text-sell'}`}>
                  {formatPercent(a.dailyChangePercent)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={showConfirmModal} onClose={() => setShowConfirmModal(false)} title="Confirm Trade">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3 py-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                pendingDirection === 'BUY' ? 'bg-buy/10' : 'bg-sell/10'
              }`}
            >
              {pendingDirection === 'BUY' ? (
                <TrendingUp size={28} className="text-buy" />
              ) : (
                <TrendingDown size={28} className="text-sell" />
              )}
            </div>
          </div>

          <div className="space-y-3">
            <ConfirmRow label="Asset" value={asset.symbol} />
            <ConfirmRow label="Direction" value={pendingDirection || ''} valueClass={pendingDirection === 'BUY' ? 'text-buy' : 'text-sell'} />
            <ConfirmRow label="Investment" value={formatCurrency(investmentNum, currency)} />
            <ConfirmRow label="Entry Price" value={formatCurrency(asset.currentPrice, currency)} />
            <ConfirmRow label="Profit Rate" value={`${profitPercent}%`} />
            <ConfirmRow label="Potential Profit" value={`+${formatCurrency(potentialProfit, currency)}`} valueClass="text-buy" />
            <ConfirmRow label="Duration" value={formatCountdown(duration)} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button
              variant={pendingDirection === 'BUY' ? 'buy' : 'sell'}
              fullWidth
              onClick={confirmTrade}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </PageTransition>
  )
}

function ConfirmRow({ label, value, valueClass = 'text-text-primary' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className={`text-sm font-semibold ${valueClass}`}>{value}</span>
    </div>
  )
}

const OpenTradesPanel = memo(function OpenTradesPanel({ trades, currentPrice, currency }: { trades: Trade[]; currentPrice: number; currency: any }) {
  const now = Date.now()
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="card p-4 overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-3">
        <Layers size={16} className="text-accent" />
        <h2 className="text-sm font-bold text-text-primary">Open Trades</h2>
        <Badge variant="info">{trades.length}</Badge>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="popLayout">
          {trades.map((trade) => {
            const isBuy = trade.direction === 'BUY'
            const remaining = getRemainingSeconds(trade, now)
            const floatingPnl = getFloatingPnl(trade.direction, trade.entryPrice, currentPrice, trade.investment, trade.profitPercent)
            const winning = isWinning(trade.direction, trade.entryPrice, currentPrice)
            const progress = getProgressPercent(trade, now)

            return (
              <motion.div
                key={trade.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="p-3 rounded-xl bg-surface border border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isBuy ? 'bg-buy/10' : 'bg-sell/10'}`}>
                      {isBuy ? <TrendingUp size={12} className="text-buy" /> : <TrendingDown size={12} className="text-sell" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text-primary">{trade.direction}</p>
                      <p className="text-[10px] text-text-secondary">{trade.symbol}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={11} className="text-text-secondary" />
                    <span className="text-xs font-mono text-text-secondary">{formatCountdown(remaining)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center mb-2">
                  <div>
                    <p className="text-[10px] text-text-secondary">Entry</p>
                    <p className="text-xs font-semibold text-text-primary">{formatCurrency(trade.entryPrice, currency)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-secondary">Current</p>
                    <p className="text-xs font-semibold text-text-primary">{formatCurrency(currentPrice, currency)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-secondary">Invest</p>
                    <p className="text-xs font-semibold text-text-primary">{formatCurrency(trade.investment, currency)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-secondary">P/L</span>
                  <motion.span
                    key={Math.floor(floatingPnl * 100)}
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                    className={`text-xs font-bold ${winning ? 'text-buy' : 'text-sell'}`}
                  >
                    {winning ? '+' : ''}{formatCurrency(floatingPnl, currency)}
                  </motion.span>
                </div>

                <div className="h-1 bg-surface rounded-full overflow-hidden mt-2">
                  <motion.div
                    className={`h-full ${winning ? 'bg-buy' : 'bg-sell'}`}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: 'linear', duration: 0.25 }}
                  />
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  )
})

const PositionRow = memo(function PositionRow({ trade, currentPrice, currency }: { trade: Trade; currentPrice: number; currency: any }) {
  const now = Date.now()
  const remaining = getRemainingSeconds(trade, now)
  const isBuy = trade.direction === 'BUY'
  const winning = isWinning(trade.direction, trade.entryPrice, currentPrice)
  const floatingPnl = getFloatingPnl(trade.direction, trade.entryPrice, currentPrice, trade.investment, trade.profitPercent)
  const progress = getProgressPercent(trade, now)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-3 rounded-xl bg-surface border border-border"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isBuy ? 'bg-buy/10' : 'bg-sell/10'}`}>
            {isBuy ? <TrendingUp size={14} className="text-buy" /> : <TrendingDown size={14} className="text-sell" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">{trade.direction} {trade.symbol}</p>
            <p className="text-xs text-text-secondary">{formatCurrency(trade.investment, currency)}</p>
          </div>
        </div>
        <div className="text-right">
          <motion.p
            key={Math.floor(floatingPnl * 100)}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className={`text-sm font-bold ${winning ? 'text-buy' : 'text-sell'}`}
          >
            {winning ? '+' : ''}{formatCurrency(floatingPnl, currency)}
          </motion.p>
          <div className="flex items-center gap-1 justify-end">
            <Clock size={12} className="text-text-secondary" />
            <span className="text-xs text-text-secondary font-mono">{formatCountdown(remaining)}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center mb-2">
        <div>
          <p className="text-[10px] text-text-secondary">Entry</p>
          <p className="text-xs font-medium text-text-primary">{formatCurrency(trade.entryPrice, currency)}</p>
        </div>
        <div>
          <p className="text-[10px] text-text-secondary">Current</p>
          <p className="text-xs font-medium text-text-primary">{formatCurrency(currentPrice, currency)}</p>
        </div>
        <div>
          <p className="text-[10px] text-text-secondary">Profit %</p>
          <p className="text-xs font-medium text-text-primary">{trade.profitPercent}%</p>
        </div>
      </div>
      <div className="h-1 bg-surface rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${winning ? 'bg-buy' : 'bg-sell'}`}
          animate={{ width: `${progress}%` }}
          transition={{ ease: 'linear', duration: 0.25 }}
        />
      </div>
    </motion.div>
  )
})

const HistoryRow = memo(function HistoryRow({ trade, currency }: { trade: Trade; currency: any }) {
  const isBuy = trade.direction === 'BUY'
  const isWin = trade.status === 'win'
  const isDraw = trade.status === 'draw'
  const pnl = isWin ? trade.payout - trade.investment : isDraw ? 0 : -trade.investment

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isBuy ? 'bg-buy/10' : 'bg-sell/10'}`}>
          {isBuy ? <TrendingUp size={14} className="text-buy" /> : <TrendingDown size={14} className="text-sell" />}
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary">{trade.direction} {trade.symbol}</p>
          <p className="text-xs text-text-secondary">{formatDateTime(trade.createdAt)}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-sm font-bold ${isWin ? 'text-buy' : isDraw ? 'text-text-secondary' : 'text-sell'}`}>
          {isWin ? '+' : ''}{formatCurrency(pnl, currency)}
        </p>
        <Badge variant={isWin ? 'success' : isDraw ? 'neutral' : 'error'}>
          {isWin ? 'Win' : isDraw ? 'Draw' : 'Loss'}
        </Badge>
      </div>
    </div>
  )
})

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$', IDR: 'Rp', EUR: '€', GBP: '£', JPY: '¥', SGD: 'S$', MYR: 'RM',
  }
  return symbols[currency] || '$'
}
