import '@testing-library/jest-dom/vitest'

window.scrollTo = vi.fn()

window.matchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}))

export const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubEnv('VITE_API_URL', 'https://api.example.com')
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})
