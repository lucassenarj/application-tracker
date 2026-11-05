import { screen, waitFor } from '@testing-library/react'
import type userEvent from '@testing-library/user-event'

export async function submitWhenEnabled(
  user: ReturnType<typeof userEvent.setup>,
  buttonName: string,
) {
  const submitButton = screen.getByRole('button', { name: buttonName })
  await waitFor(() => expect(submitButton).not.toBeDisabled())
  await user.click(submitButton)
}
