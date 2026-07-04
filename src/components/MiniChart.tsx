import { useEffect, useRef, memo } from 'react'
import type { Candle } from '../types'

interface MiniChartProps {
  candles: Candle[]
  width?: number
  height?: number
  positive: boolean
}

export const MiniChart = memo(function MiniChart({ candles, width = 80, height = 32, positive }: MiniChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || candles.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, width, height)

    const recentCandles = candles.slice(-30)
    if (recentCandles.length < 2) return

    const prices = recentCandles.flatMap((c) => [c.high, c.low])
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min || 1

    const color = positive ? '#16C784' : '#EA3943'
    ctx.strokeStyle = color
    ctx.fillStyle = `${color}15`
    ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'

    const points = recentCandles.map((c, i) => ({
      x: (i / (recentCandles.length - 1)) * width,
      y: height - ((c.close - min) / range) * (height - 4) - 2,
    }))

    ctx.beginPath()
    ctx.moveTo(points[0].x, height)
    ctx.lineTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      const cp1x = (points[i - 1].x + points[i].x) / 2
      ctx.bezierCurveTo(cp1x, points[i - 1].y, cp1x, points[i].y, points[i].x, points[i].y)
    }
    ctx.lineTo(points[points.length - 1].x, height)
    ctx.closePath()
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      const cp1x = (points[i - 1].x + points[i].x) / 2
      ctx.bezierCurveTo(cp1x, points[i - 1].y, cp1x, points[i].y, points[i].x, points[i].y)
    }
    ctx.stroke()
  }, [candles, width, height, positive])

  return <canvas ref={canvasRef} style={{ width, height }} className="block" />
})
