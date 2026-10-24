import { render, screen } from '@testing-library/react'
import { RouteLoadingBar } from '@/components/route-loading-bar'

describe('RouteLoadingBar', () => {
  it('renders a loading indicator', () => {
    render(<RouteLoadingBar />)

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('exposes a status role so screen readers announce the loading state', () => {
    render(<RouteLoadingBar />)

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
  })
})
