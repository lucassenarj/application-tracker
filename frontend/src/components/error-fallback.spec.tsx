import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorFallback } from '@/components/error-fallback'

describe('ErrorFallback', () => {
  it('renders a "Something went wrong" message', () => {
    render(<ErrorFallback resetError={() => {}} />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('renders a "Try again" button', () => {
    render(<ErrorFallback resetError={() => {}} />)

    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('calls resetError when "Try again" is clicked', async () => {
    const user = userEvent.setup()
    const resetError = vi.fn()
    render(<ErrorFallback resetError={resetError} />)

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(resetError).toHaveBeenCalled()
  })
})
