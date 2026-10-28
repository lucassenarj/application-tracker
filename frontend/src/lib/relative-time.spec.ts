import { formatRelativeTime } from '@/lib/relative-time'

describe('formatRelativeTime', () => {
  it('formats a difference of a few minutes as "X minutes ago"', () => {
    const now = new Date('2026-01-01T12:05:00.000Z')
    const date = new Date('2026-01-01T12:00:00.000Z')

    expect(formatRelativeTime(date, now, 'en')).toBe('5 minutes ago')
  })

  it('formats a difference of several hours as "X hours ago"', () => {
    const now = new Date('2026-01-01T15:00:00.000Z')
    const date = new Date('2026-01-01T12:00:00.000Z')

    expect(formatRelativeTime(date, now, 'en')).toBe('3 hours ago')
  })

  it('formats a difference of several days as "X days ago"', () => {
    const now = new Date('2026-01-05T12:00:00.000Z')
    const date = new Date('2026-01-01T12:00:00.000Z')

    expect(formatRelativeTime(date, now, 'en')).toBe('4 days ago')
  })

  it('falls back to the browser locale when no locale is given', () => {
    const languageGetter = vi
      .spyOn(navigator, 'language', 'get')
      .mockReturnValue('pt-BR')
    const now = new Date('2026-01-01T12:05:00.000Z')
    const date = new Date('2026-01-01T12:00:00.000Z')

    expect(formatRelativeTime(date, now)).toBe('há 5 minutos')

    languageGetter.mockRestore()
  })
})
