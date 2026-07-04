import type { Candle, MarketMode, MarketSettings } from '../types'

const CANDLE_INTERVAL = 5000

function gaussianRandom(): number {
  let u = 0
  let v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

export function generateInitialCandles(
  basePrice: number,
  count: number,
  settings: Pick<MarketSettings, 'mode' | 'volatility' | 'trendStrength'>,
): Candle[] {
  const candles: Candle[] = []
  const now = Date.now()
  const startTime = now - count * CANDLE_INTERVAL
  let prevClose = basePrice

  for (let i = 0; i < count; i++) {
    const time = Math.floor((startTime + i * CANDLE_INTERVAL) / 1000)
    const candle = generateNextCandle(prevClose, settings, time)
    candles.push(candle)
    prevClose = candle.close
  }

  return candles
}

export function generateNextCandle(
  prevClose: number,
  settings: Pick<MarketSettings, 'mode' | 'volatility' | 'trendStrength'>,
  time?: number,
): Candle {
  const { mode, volatility, trendStrength } = settings
  const volatilityFactor = volatility / 50
  const trendFactor = trendStrength / 50

  let drift = 0
  if (mode === 'uptrend') drift = trendFactor * 0.0008
  else if (mode === 'downtrend') drift = -trendFactor * 0.0008

  const randomComponent = gaussianRandom() * 0.001 * volatilityFactor
  const changePercent = drift + randomComponent
  const priceChange = prevClose * changePercent

  const open = prevClose
  const close = Math.max(0.0001, open + priceChange)

  const range = Math.abs(priceChange) + Math.abs(gaussianRandom() * 0.0008 * volatilityFactor * prevClose)
  const high = Math.max(open, close) + Math.random() * range * 0.5
  const low = Math.min(open, close) - Math.random() * range * 0.5

  return {
    time: time ?? Math.floor(Date.now() / 1000),
    open: round(open),
    high: round(Math.max(high, open, close)),
    low: round(Math.max(0.0001, Math.min(low, open, close))),
    close: round(close),
  }
}

export function updateLiveCandle(
  candle: Candle,
  settings: Pick<MarketSettings, 'mode' | 'volatility' | 'trendStrength'>,
): Candle {
  const { mode, volatility, trendStrength } = settings
  const volatilityFactor = volatility / 50
  const trendFactor = trendStrength / 50

  let drift = 0
  if (mode === 'uptrend') drift = trendFactor * 0.0003
  else if (mode === 'downtrend') drift = -trendFactor * 0.0003

  const tick = gaussianRandom() * 0.0004 * volatilityFactor
  const changePercent = drift + tick
  const newPrice = Math.max(0.0001, candle.close * (1 + changePercent))

  return {
    ...candle,
    close: round(newPrice),
    high: round(Math.max(candle.high, newPrice)),
    low: round(Math.min(candle.low, newPrice)),
  }
}

export function getTickInterval(speed: number): number {
  return Math.max(50, Math.min(150, 150 - speed * 1))
}

export function getMarketModeLabel(mode: MarketMode): string {
  switch (mode) {
    case 'random':
      return 'Random'
    case 'uptrend':
      return 'Uptrend'
    case 'downtrend':
      return 'Downtrend'
  }
}

function round(value: number): number {
  if (value < 1) return Math.round(value * 100000) / 100000
  if (value < 100) return Math.round(value * 1000) / 1000
  return Math.round(value * 100) / 100
}

export { CANDLE_INTERVAL }
