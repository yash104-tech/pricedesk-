import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export { DEFAULT_CURRENCY, formatCurrency } from '@/lib/currency'

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatRelative(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(date)
}

export type MarginTier = 'success' | 'warning' | 'danger'

export function getMarginTier(pct: number): MarginTier {
  if (pct > 20) return 'success'
  if (pct >= 10) return 'warning'
  return 'danger'
}

export function getMarginColor(pct: number): string {
  const tier = getMarginTier(pct)
  if (tier === 'success') return 'text-emerald-500'
  if (tier === 'warning') return 'text-amber-500'
  return 'text-red-500'
}

export function getMarginBg(pct: number): string {
  const tier = getMarginTier(pct)
  if (tier === 'success') return 'bg-emerald-500/10 border-emerald-500/20'
  if (tier === 'warning') return 'bg-amber-500/10 border-amber-500/20'
  return 'bg-red-500/10 border-red-500/20'
}
