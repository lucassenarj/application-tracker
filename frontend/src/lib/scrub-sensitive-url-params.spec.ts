import { scrubSensitiveUrlParams } from './scrub-sensitive-url-params'

describe('scrubSensitiveUrlParams', () => {
  it('redacts the token value from a relative URL', () => {
    expect(scrubSensitiveUrlParams('/reset-password?token=abc123')).toBe(
      '/reset-password?token=[REDACTED]',
    )
  })

  it('redacts the token value from an absolute URL', () => {
    expect(
      scrubSensitiveUrlParams('https://app.example.com/verify-email?token=abc123'),
    ).toBe('https://app.example.com/verify-email?token=[REDACTED]')
  })

  it('redacts the token when it is not the first query param', () => {
    expect(scrubSensitiveUrlParams('/reset-password?foo=bar&token=abc123')).toBe(
      '/reset-password?foo=bar&token=[REDACTED]',
    )
  })

  it('leaves other query params unchanged', () => {
    expect(
      scrubSensitiveUrlParams('/reset-password?token=abc123&foo=bar'),
    ).toBe('/reset-password?token=[REDACTED]&foo=bar')
  })

  it('leaves a URL with no sensitive params unchanged', () => {
    expect(scrubSensitiveUrlParams('/applications?page=1')).toBe(
      '/applications?page=1',
    )
  })

  it('matches the token param case-insensitively', () => {
    expect(scrubSensitiveUrlParams('/reset-password?TOKEN=abc123')).toBe(
      '/reset-password?TOKEN=[REDACTED]',
    )
  })
})
