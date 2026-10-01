import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeToggle } from '@/components/theme-toggle'

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('renders a theme toggle button', async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )

    expect(
      await screen.findByRole('button', { name: 'Toggle theme' }),
    ).toBeInTheDocument()
  })

  it('selecting Dark from the menu switches the app to dark mode', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )

    await user.click(
      await screen.findByRole('button', { name: 'Toggle theme' }),
    )
    await user.click(await screen.findByRole('menuitem', { name: 'Dark' }))

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
