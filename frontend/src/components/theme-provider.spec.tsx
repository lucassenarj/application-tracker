import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, useTheme } from '@/components/theme-provider'

function ThemeConsumer() {
  const { theme, setTheme } = useTheme()
  return (
    <div>
      <span>{theme}</span>
      <button onClick={() => setTheme('light')}>light</button>
      <button onClick={() => setTheme('dark')}>dark</button>
      <button onClick={() => setTheme('system')}>system</button>
    </div>
  )
}

describe('ThemeProvider / useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('defaults to system when no theme is stored', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )

    expect(
      screen.getByText('system', { selector: 'span' }),
    ).toBeInTheDocument()
  })

  it('applies the dark class when the resolved theme is dark', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'dark' }))

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('applies no dark class (light) when the resolved theme is light', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'dark' }))
    await user.click(screen.getByRole('button', { name: 'light' }))

    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('persists the chosen theme to localStorage and restores it on next mount', async () => {
    const user = userEvent.setup()
    const { unmount } = render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'dark' }))
    unmount()

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )

    expect(screen.getByText('dark', { selector: 'span' })).toBeInTheDocument()
  })

  it('resolves "system" to the OS preference via matchMedia', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('updates the resolved theme when the OS preference changes while set to "system"', () => {
    let changeListener: (() => void) | undefined
    let matches = false
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches,
        media: query,
        addEventListener: (_event: string, listener: () => void) => {
          changeListener = listener
        },
        removeEventListener: vi.fn(),
      })),
    )

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )

    expect(document.documentElement.classList.contains('dark')).toBe(false)

    matches = true
    changeListener?.()

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
