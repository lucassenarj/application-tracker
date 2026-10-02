import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PasswordInput } from '@/components/password-input'

describe('PasswordInput', () => {
  it('renders as a password input by default, with a "Show password" toggle', () => {
    render(<PasswordInput aria-label="Password" />)

    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'type',
      'password',
    )
    expect(
      screen.getByRole('button', { name: 'Show password' }),
    ).toBeInTheDocument()
  })

  it('clicking the toggle reveals the password as plain text', async () => {
    const user = userEvent.setup()
    render(<PasswordInput aria-label="Password" />)

    await user.click(screen.getByRole('button', { name: 'Show password' }))

    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text')
    expect(
      screen.getByRole('button', { name: 'Hide password' }),
    ).toBeInTheDocument()
  })

  it('clicking the toggle again hides the password', async () => {
    const user = userEvent.setup()
    render(<PasswordInput aria-label="Password" />)

    await user.click(screen.getByRole('button', { name: 'Show password' }))
    await user.click(screen.getByRole('button', { name: 'Hide password' }))

    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'type',
      'password',
    )
  })
})
