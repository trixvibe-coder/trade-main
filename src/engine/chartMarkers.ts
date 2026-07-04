import type { IChartApi, ISeriesApi, UTCTimestamp, IPriceLine, Time } from 'lightweight-charts'
import type { Trade, TradeDirection, TradeStatus } from '../types'

export interface ChartMarker {
  tradeId: string
  entryPriceLine: IPriceLine | null
  entryPrice: number
  entryTime: UTCTimestamp
  direction: TradeDirection
  status: TradeStatus
  expiryTime: UTCTimestamp
  resultBadge: HTMLElement | null
  entryBadge: HTMLElement | null
  expiryLine: HTMLElement | null
  expiryTimer: HTMLElement | null
  removalTimeout: ReturnType<typeof setTimeout> | null
}

const markerColors = {
  BUY: { line: '#16C784', bg: 'rgba(22,199,132,0.12)', text: '#16C784' },
  SELL: { line: '#EA3943', bg: 'rgba(234,57,67,0.12)', text: '#EA3943' },
}

const resultConfig = {
  win: { label: 'WIN', color: '#16C784', bg: 'rgba(22,199,132,0.15)' },
  loss: { label: 'LOSE', color: '#EA3943', bg: 'rgba(234,57,67,0.15)' },
  draw: { label: 'DRAW', color: '#9CA3AF', bg: 'rgba(156,163,175,0.15)' },
}

function badgeStyles(colors: typeof markerColors['BUY']): string {
  return [
    'position:absolute',
    'pointer-events:none',
    'z-index:10',
    'padding:4px 8px',
    'border-radius:6px',
    'font-size:10px',
    'font-weight:700',
    'font-family:Inter,sans-serif',
    'color:' + colors.text,
    'background:' + colors.bg,
    'border:1px solid ' + colors.line + '40',
    'white-space:nowrap',
    'transition:opacity 0.3s ease,transform 0.3s ease',
    'transform:translate(-50%,-50%)',
    'line-height:1.3',
  ].join(';')
}

function expiryLineStyles(colors: typeof markerColors['BUY']): string {
  return [
    'position:absolute',
    'pointer-events:none',
    'z-index:5',
    'width:1px',
    'border-left:1px dashed ' + colors.line + '80',
    'top:0',
    'bottom:0',
    'transition:opacity 0.3s ease',
  ].join(';')
}

function timerStyles(colors: typeof markerColors['BUY']): string {
  return [
    'position:absolute',
    'pointer-events:none',
    'z-index:10',
    'padding:2px 6px',
    'border-radius:4px',
    'font-size:11px',
    'font-weight:600',
    'font-family:Inter,sans-serif',
    'color:' + colors.text,
    'background:' + colors.bg,
    'border:1px solid ' + colors.line + '40',
    'white-space:nowrap',
    'transform:translateX(-50%)',
    'transition:opacity 0.3s ease',
  ].join(';')
}

function resultBadgeStyles(config: typeof resultConfig['win']): string {
  return [
    'position:absolute',
    'pointer-events:none',
    'z-index:20',
    'padding:4px 10px',
    'border-radius:6px',
    'font-size:12px',
    'font-weight:700',
    'font-family:Inter,sans-serif',
    'color:' + config.color,
    'background:' + config.bg,
    'border:1px solid ' + config.color + '60',
    'white-space:nowrap',
    'transform:translate(-50%,-50%)',
    'transition:opacity 0.5s ease,transform 0.5s ease',
  ].join(';')
}

function removeElement(el: HTMLElement | null): void {
  if (el && el.parentNode) {
    el.parentNode.removeChild(el)
  }
}

export class TradeMarkerManager {
  private chart: IChartApi
  private series: ISeriesApi<'Candlestick'>
  private markers: Map<string, ChartMarker> = new Map()
  private container: HTMLElement

  constructor(chart: IChartApi, series: ISeriesApi<'Candlestick'>, container: HTMLElement) {
    this.chart = chart
    this.series = series
    this.container = container
  }

  addTrade(trade: Trade, currencySymbol: string = '$'): void {
    if (this.markers.has(trade.id)) return

    const colors = markerColors[trade.direction]
    const entryTime = Math.floor(trade.createdAt / 1000) as UTCTimestamp
    const expiryTime = Math.floor(trade.expiresAt / 1000) as UTCTimestamp

    const entryPriceLine = this.series.createPriceLine({
      price: trade.entryPrice,
      color: colors.line,
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: '',
    })

    const entryBadge = this.createBadge(trade.direction, colors, trade.investment, trade.entryPrice, currencySymbol)
    const expiryLine = this.createExpiryLine(colors)
    const expiryTimer = this.createExpiryTimer(colors)

    const marker: ChartMarker = {
      tradeId: trade.id,
      entryPriceLine,
      entryPrice: trade.entryPrice,
      entryTime,
      direction: trade.direction,
      status: 'open',
      expiryTime,
      resultBadge: null,
      entryBadge,
      expiryLine,
      expiryTimer,
      removalTimeout: null,
    }

    this.markers.set(trade.id, marker)
    this.updatePositions()
  }

  private createBadge(
    direction: TradeDirection,
    colors: typeof markerColors['BUY'],
    investment: number,
    entryPrice: number,
    currencySymbol: string,
  ): HTMLElement {
    const badge = document.createElement('div')
    badge.style.cssText = badgeStyles(colors)
    const priceStr = entryPrice < 1 ? entryPrice.toFixed(4) : entryPrice.toFixed(2)
    badge.innerHTML =
      direction +
      '<br><span style="font-size:9px;font-weight:500;opacity:0.8">' +
      currencySymbol + investment + ' @ ' + currencySymbol + priceStr +
      '</span>'
    this.container.appendChild(badge)
    return badge
  }

  private createExpiryLine(colors: typeof markerColors['BUY']): HTMLElement {
    const line = document.createElement('div')
    line.style.cssText = expiryLineStyles(colors)
    this.container.appendChild(line)
    return line
  }

  private createExpiryTimer(colors: typeof markerColors['BUY']): HTMLElement {
    const timer = document.createElement('div')
    timer.style.cssText = timerStyles(colors)
    timer.textContent = '00:00'
    this.container.appendChild(timer)
    return timer
  }

  private createResultBadge(status: 'win' | 'loss' | 'draw'): HTMLElement {
    const config = resultConfig[status]
    const badge = document.createElement('div')
    badge.style.cssText = resultBadgeStyles(config)
    badge.textContent = config.label
    this.container.appendChild(badge)
    return badge
  }

  setResult(tradeId: string, status: 'win' | 'loss' | 'draw'): void {
    const marker = this.markers.get(tradeId)
    if (!marker || marker.status !== 'open') return

    marker.status = status

    if (marker.entryBadge) {
      marker.entryBadge.style.opacity = '0'
      const oldBadge = marker.entryBadge
      marker.entryBadge = null
      setTimeout(() => removeElement(oldBadge), 300)
    }

    marker.resultBadge = this.createResultBadge(status)
    this.updatePositions()

    marker.removalTimeout = setTimeout(() => {
      this.removeMarker(tradeId)
    }, 3000)
  }

  updateTimer(tradeId: string, remainingSeconds: number): void {
    const marker = this.markers.get(tradeId)
    if (!marker || !marker.expiryTimer || marker.status !== 'open') return

    const mins = Math.floor(remainingSeconds / 60)
    const secs = remainingSeconds % 60
    marker.expiryTimer.textContent =
      mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0')

    if (remainingSeconds <= 5) {
      marker.expiryTimer.style.color = '#EA3943'
      marker.expiryTimer.style.background = 'rgba(234,57,67,0.15)'
      marker.expiryTimer.style.borderColor = '#EA394340'
    }
  }

  updatePositions(): void {
    const timeScale = this.chart.timeScale()

    for (const marker of this.markers.values()) {
      const entryX = timeScale.timeToCoordinate(marker.entryTime as Time)
      const expiryX = timeScale.timeToCoordinate(marker.expiryTime as Time)
      const entryY = this.series.priceToCoordinate(marker.entryPrice)

      if (marker.entryBadge) {
        if (entryX !== null && entryY !== null) {
          marker.entryBadge.style.left = entryX + 'px'
          marker.entryBadge.style.top = entryY + 'px'
          marker.entryBadge.style.opacity = '1'
        } else {
          marker.entryBadge.style.opacity = '0'
        }
      }

      if (marker.resultBadge) {
        if (entryX !== null && entryY !== null) {
          marker.resultBadge.style.left = entryX + 'px'
          marker.resultBadge.style.top = entryY + 'px'
          marker.resultBadge.style.opacity = '1'
        } else {
          marker.resultBadge.style.opacity = '0'
        }
      }

      if (marker.expiryLine) {
        if (expiryX !== null) {
          marker.expiryLine.style.left = expiryX + 'px'
          marker.expiryLine.style.opacity = '1'
        } else {
          marker.expiryLine.style.opacity = '0'
        }
      }

      if (marker.expiryTimer) {
        if (expiryX !== null) {
          marker.expiryTimer.style.left = expiryX + 'px'
          marker.expiryTimer.style.top = '4px'
          marker.expiryTimer.style.opacity = '1'
        } else {
          marker.expiryTimer.style.opacity = '0'
        }
      }
    }
  }

  removeMarker(tradeId: string): void {
    const marker = this.markers.get(tradeId)
    if (!marker) return

    if (marker.removalTimeout) {
      clearTimeout(marker.removalTimeout)
      marker.removalTimeout = null
    }

    if (marker.entryPriceLine) {
      this.series.removePriceLine(marker.entryPriceLine)
    }

    const elements = [marker.entryBadge, marker.expiryLine, marker.expiryTimer, marker.resultBadge]
    for (const el of elements) {
      if (el) {
        el.style.opacity = '0'
        const toRemove = el
        setTimeout(() => removeElement(toRemove), 300)
      }
    }

    this.markers.delete(tradeId)
  }

  clearAll(): void {
    for (const tradeId of Array.from(this.markers.keys())) {
      this.removeMarker(tradeId)
    }
  }

  hasMarker(tradeId: string): boolean {
    return this.markers.has(tradeId)
  }
}
