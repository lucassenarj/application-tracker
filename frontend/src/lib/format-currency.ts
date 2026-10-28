export function formatCurrency(
  amount: number,
  locale: string = navigator.language,
  currency: string = 'EUR',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}
