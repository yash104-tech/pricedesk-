/** PriceDesk dynamic currency utility */
export let DEFAULT_CURRENCY = (() => {
  try {
    return localStorage.getItem('pricedesk_currency') || 'INR'
  } catch {
    return 'INR'
  }
})()

export function setGlobalCurrency(currency: string) {
  DEFAULT_CURRENCY = currency
  try {
    localStorage.setItem('pricedesk_currency', currency)
  } catch (e) {
    console.error('Error saving active currency:', e)
  }
}

export const SUPPORTED_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY'] as const

const LOCALE_MAP: Record<string, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  JPY: 'ja-JP',
}

export function formatCurrency(value: number, currency: string = DEFAULT_CURRENCY): string {
  const selectedCurrency = currency || DEFAULT_CURRENCY
  const locale = LOCALE_MAP[selectedCurrency] || 'en-IN'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: selectedCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatCurrencyCompact(value: number, currency: string = DEFAULT_CURRENCY): string {
  const selectedCurrency = currency || DEFAULT_CURRENCY
  const locale = LOCALE_MAP[selectedCurrency] || 'en-IN'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: selectedCurrency,
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value)
}

export function formatINR(value: number): string {
  return formatCurrency(value, 'INR')
}
