/**
 * Formats a numeric price into a currency formatted string (USD by default).
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  if (amount === 0) return 'Free'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
