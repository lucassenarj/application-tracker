import { render, screen } from '@testing-library/react'
import { PublicHeader } from '@/components/public-header'
import { ThemeProvider } from '@/components/theme-provider'

describe('PublicHeader', () => {
  it('renders the app title and a theme toggle', () => {
    render(
      <ThemeProvider>
        <PublicHeader />
      </ThemeProvider>,
    )

    expect(screen.getByText('Application Tracker')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Toggle theme' }),
    ).toBeInTheDocument()
  })
})
