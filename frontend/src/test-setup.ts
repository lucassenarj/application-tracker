import '@testing-library/jest-dom/vitest'

window.scrollTo = vi.fn()

window.matchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}))
