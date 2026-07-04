import { useEffect, useRef, useState } from 'react'

export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (delay === null) return
    const id = setInterval(() => savedCallback.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}

export function useCountdown(targetTime: number | null): number {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (targetTime === null) {
      setRemaining(0)
      return
    }

    const update = () => {
      const diff = Math.max(0, Math.ceil((targetTime - Date.now()) / 1000))
      setRemaining(diff)
    }

    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [targetTime])

  return remaining
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const media = window.matchMedia(query)
    const handler = () => setMatches(media.matches)
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [query])

  return matches
}
