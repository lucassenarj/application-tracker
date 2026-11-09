import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreatePersonalAccessTokenDialog } from '@/components/create-personal-access-token-dialog'
import { fetchMock } from '@/test-setup'

function renderDialog(queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <CreatePersonalAccessTokenDialog />
    </QueryClientProvider>,
  )
}

function mockCreateTokenResponse(
  overrides: Partial<{
    id: string
    label: string
    token: string
    expiresAt?: string
    createdAt: string
  }> = {},
) {
  const payload = {
    id: 'token-1',
    label: 'LinkedIn extension',
    token: 'raw-plaintext-token',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
  fetchMock.mockImplementation(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(payload) }),
  )
  return payload
}

async function openDialogAndFillLabel(
  user: ReturnType<typeof userEvent.setup>,
  label = 'LinkedIn extension',
) {
  await user.click(screen.getByRole('button', { name: 'Add Token' }))
  await user.type(await screen.findByLabelText('Label'), label)
}

describe('CreatePersonalAccessTokenDialog', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    mockCreateTokenResponse()
  })

  it('renders an "Add Token" trigger button', () => {
    renderDialog(queryClient)

    expect(
      screen.getByRole('button', { name: 'Add Token' }),
    ).toBeInTheDocument()
  })

  it('opens the dialog with a Label field and an Expiration select', async () => {
    const user = userEvent.setup()
    renderDialog(queryClient)

    await user.click(screen.getByRole('button', { name: 'Add Token' }))

    expect(await screen.findByLabelText('Label')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('shows a date field only when "Custom" expiration is selected', async () => {
    const user = userEvent.setup()
    renderDialog(queryClient)
    await user.click(screen.getByRole('button', { name: 'Add Token' }))

    expect(screen.queryByLabelText('Expiration Date')).not.toBeInTheDocument()

    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: 'Custom' }))

    expect(await screen.findByLabelText('Expiration Date')).toBeInTheDocument()
  })

  it('submits the label and no expiresAt when "Never" is selected', async () => {
    const user = userEvent.setup()
    renderDialog(queryClient)
    await openDialogAndFillLabel(user)

    await user.click(screen.getByRole('button', { name: 'Create Token' }))

    await waitFor(() => {
      const call = fetchMock.mock.calls.find(([url]) =>
        (url as string).includes('/auth/personal-access-tokens'),
      )
      expect(call).toBeDefined()
      const body = JSON.parse(call?.[1]?.body as string)
      expect(body).toEqual({ label: 'LinkedIn extension', expiresAt: undefined })
    })
  })

  it('submits an expiresAt about a week out when "1 week" is selected', async () => {
    const beforeSubmit = Date.now()
    const user = userEvent.setup()
    renderDialog(queryClient)
    await openDialogAndFillLabel(user)

    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: '1 week' }))
    await user.click(screen.getByRole('button', { name: 'Create Token' }))

    await waitFor(() => {
      const call = fetchMock.mock.calls.find(([url]) =>
        (url as string).includes('/auth/personal-access-tokens'),
      )
      const body = JSON.parse(call?.[1]?.body as string)
      const expiresAt = new Date(body.expiresAt).getTime()
      const expected = beforeSubmit + 7 * 24 * 60 * 60 * 1000
      expect(Math.abs(expiresAt - expected)).toBeLessThan(5000)
    })
  })

  it('submits an expiresAt about a month out when "1 month" is selected', async () => {
    const beforeSubmit = Date.now()
    const user = userEvent.setup()
    renderDialog(queryClient)
    await openDialogAndFillLabel(user)

    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: '1 month' }))
    await user.click(screen.getByRole('button', { name: 'Create Token' }))

    await waitFor(() => {
      const call = fetchMock.mock.calls.find(([url]) =>
        (url as string).includes('/auth/personal-access-tokens'),
      )
      const body = JSON.parse(call?.[1]?.body as string)
      const expiresAt = new Date(body.expiresAt).getTime()
      const expected = beforeSubmit + 30 * 24 * 60 * 60 * 1000
      expect(Math.abs(expiresAt - expected)).toBeLessThan(5000)
    })
  })

  it('submits the picked date as expiresAt when "Custom" is selected', async () => {
    const user = userEvent.setup()
    renderDialog(queryClient)
    await openDialogAndFillLabel(user)

    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: 'Custom' }))
    fireEvent.change(await screen.findByLabelText('Expiration Date'), {
      target: { value: '2026-12-01' },
    })
    await user.click(screen.getByRole('button', { name: 'Create Token' }))

    await waitFor(() => {
      const call = fetchMock.mock.calls.find(([url]) =>
        (url as string).includes('/auth/personal-access-tokens'),
      )
      const body = JSON.parse(call?.[1]?.body as string)
      expect(body.expiresAt).toBe('2026-12-01')
    })
  })

  it('shows the plaintext token and a Copy button after a successful submit, instead of the form', async () => {
    const user = userEvent.setup()
    renderDialog(queryClient)
    await openDialogAndFillLabel(user)

    await user.click(screen.getByRole('button', { name: 'Create Token' }))

    expect(
      await screen.findByDisplayValue('raw-plaintext-token'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Label')).not.toBeInTheDocument()
  })

  it('copies the token to the clipboard when the Copy button is clicked', async () => {
    const writeTextSpy = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderDialog(queryClient)
    await openDialogAndFillLabel(user)
    await user.click(screen.getByRole('button', { name: 'Create Token' }))

    await user.click(await screen.findByRole('button', { name: 'Copy' }))

    expect(writeTextSpy).toHaveBeenCalledWith('raw-plaintext-token')
  })

  it('closing the dialog after reveal resets back to the form', async () => {
    const user = userEvent.setup()
    renderDialog(queryClient)
    await openDialogAndFillLabel(user)
    await user.click(screen.getByRole('button', { name: 'Create Token' }))
    await screen.findByRole('button', { name: 'Copy' })

    await user.click(screen.getByRole('button', { name: 'Done' }))
    await user.click(screen.getByRole('button', { name: 'Add Token' }))

    expect(await screen.findByLabelText('Label')).toHaveValue('')
  })
})
