import { render, screen } from '@testing-library/react'
import { FullPageLoader } from '@/components/full-page-loader'

describe('FullPageLoader', () => {
  it('renders a loading indicator', () => {
    render(<FullPageLoader />)

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('exposes a status role so screen readers announce the loading state', () => {
    render(<FullPageLoader />)

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
  })
})
