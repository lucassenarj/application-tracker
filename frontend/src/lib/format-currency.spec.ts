import { formatCurrency } from '@/lib/format-currency'

describe('formatCurrency', () => {
  it('formats a whole-number amount in EUR for the "en" locale', () => {
    expect(formatCurrency(90000, 'en')).toBe('€90,000')
  })

  it('places the currency symbol and uses different grouping for the "pt-BR" locale', () => {
    expect(formatCurrency(90000, 'pt-BR')).toBe('€ 90.000')
  })
  it('falls back to the browser locale when no locale is given', () => {
    const languageGetter = vi
      .spyOn(navigator, 'language', 'get')
      .mockReturnValue('pt-BR')

    expect(formatCurrency(90000)).toBe('€ 90.000')

    languageGetter.mockRestore()
  })

  it('formats using the given currency code instead of defaulting to EUR', () => {
    expect(formatCurrency(90000, 'en', 'USD')).toBe('$90,000')
  })
})
