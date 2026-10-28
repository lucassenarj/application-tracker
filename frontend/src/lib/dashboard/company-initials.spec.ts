import { getCompanyInitials } from '@/lib/dashboard/company-initials'

describe('getCompanyInitials', () => {
  it('returns the first letter of each of the first two words, uppercased', () => {
    expect(getCompanyInitials('Acme Corp')).toBe('AC')
  })

  it('returns a single letter when the company name is one word', () => {
    expect(getCompanyInitials('Globex')).toBe('G')
  })

  it('collapses extra whitespace between words', () => {
    expect(getCompanyInitials('  Acme   Corp  ')).toBe('AC')
  })
})
