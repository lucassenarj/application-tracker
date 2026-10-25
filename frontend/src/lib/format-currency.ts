export function formatCurrency(
  amount: number,
  locale: string = navigator.language,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}
