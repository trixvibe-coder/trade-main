import { STORAGE_KEYS } from '../constants'

export function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    if (item === null) return defaultValue
    return JSON.parse(item) as T
  } catch {
    return defaultValue
  }
}

export function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

export function generateId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`
}

export function generateAvatar(seed: string): string {
  const colors = [
    '3B82F6', '16C784', 'F59E0B', 'EF4444', '8B5CF6',
    'EC4899', '14B8A6', 'F97316', '06B6D4', '84CC16',
  ]
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  const color = colors[Math.abs(hash) % colors.length]
  const initials = seed.substring(0, 2).toUpperCase()
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="40" fill="#${color}"/><text x="50%" y="50%" dy=".1em" fill="white" font-family="Inter,sans-serif" font-size="32" font-weight="700" text-anchor="middle" dominant-baseline="middle">${initials}</text></svg>`,
  )}`
}

export { STORAGE_KEYS }
