import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { getStoredToken, setStoredToken } from '@/lib/token-storage'

describe('Options App', () => {
  it('shows "No token configured" when nothing is stored', async () => {
    render(<App />)

    expect(await screen.findByText('No token configured.')).toBeInTheDocument()
  })

  it('pre-fills the input and shows "Token configured" when a token already exists', async () => {
    await setStoredToken('existing-token')

    render(<App />)

    expect(await screen.findByText('Token configured.')).toBeInTheDocument()
    expect(screen.getByLabelText('Personal Access Token')).toHaveValue(
      'existing-token',
    )
  })

  it('saving calls setStoredToken with the entered value and shows a confirmation', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('No token configured.')

    await user.type(screen.getByLabelText('Personal Access Token'), 'new-token')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Token saved.')).toBeInTheDocument()
    expect(await getStoredToken()).toBe('new-token')
  })

  it('clicking Clear removes the stored token, empties the input, and flips the status back to "No token configured"', async () => {
    await setStoredToken('existing-token')
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('Token configured.')

    await user.click(screen.getByRole('button', { name: 'Clear' }))

    await waitFor(async () => {
      expect(await getStoredToken()).toBeUndefined()
    })
    expect(await screen.findByText('No token configured.')).toBeInTheDocument()
    expect(screen.getByLabelText('Personal Access Token')).toHaveValue('')
  })
})
