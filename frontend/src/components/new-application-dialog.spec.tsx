import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NewApplicationDialog } from '@/components/new-application-dialog'
import { userQueryOptions } from '@/lib/auth/user-query'
import { fetchMock } from '@/test-setup'

function renderDialog(queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <NewApplicationDialog />
    </QueryClientProvider>,
  )
}

describe('NewApplicationDialog', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/companies/search')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: '1' }),
      })
    })
  })

  it('renders the Add Application trigger button', () => {
    renderDialog(queryClient)

    expect(
      screen.getByRole('button', { name: 'Add Application' }),
    ).toBeInTheDocument()
  })

  it('opens the modal with all form fields when the trigger is clicked', async () => {
    const user = userEvent.setup()
    renderDialog(queryClient)

    await user.click(screen.getByRole('button', { name: 'Add Application' }))

    expect(
      await screen.findByRole('textbox', { name: 'Title' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: 'Company' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: 'Description' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: 'Job posting URL' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('spinbutton', { name: 'Salary' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('combobox', { name: 'Currency' }),
    ).toHaveTextContent('EUR')
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument()
  })
  it('shows a validation error when submitting with an empty title', async () => {
    const user = userEvent.setup()
    renderDialog(queryClient)

    await user.click(screen.getByRole('button', { name: 'Add Application' }))
    await user.click(await screen.findByRole('button', { name: 'Create' }))

    expect(await screen.findByText('Title is required')).toBeInTheDocument()
  })
  it('shows a validation error when submitting with an empty company', async () => {
    const user = userEvent.setup()
    renderDialog(queryClient)

    await user.click(screen.getByRole('button', { name: 'Add Application' }))
    await user.type(
      await screen.findByRole('textbox', { name: 'Title' }),
      'Senior Backend Engineer',
    )
    await user.click(screen.getByRole('button', { name: 'Create' }))

    expect(await screen.findByText('Company is required')).toBeInTheDocument()
  })
  it('shows a validation error when submitting an invalid external URL', async () => {
    const user = userEvent.setup()
    renderDialog(queryClient)

    await user.click(screen.getByRole('button', { name: 'Add Application' }))
    await user.type(
      await screen.findByRole('textbox', { name: 'Title' }),
      'Senior Backend Engineer',
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Company' }),
      'Acme Corp',
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Job posting URL' }),
      'not-a-url',
    )
    await user.click(screen.getByRole('button', { name: 'Create' }))

    expect(await screen.findByText('Enter a valid URL')).toBeInTheDocument()
  })
  it('creates the application and closes the modal on success', async () => {
    const user = userEvent.setup()
    renderDialog(queryClient)

    const trigger = screen.getByRole('button', { name: 'Add Application' })
    await user.click(trigger)
    await user.type(
      await screen.findByRole('textbox', { name: 'Title' }),
      'Senior Backend Engineer',
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Company' }),
      'Acme Corp',
    )
    await user.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() =>
      expect(trigger).toHaveAttribute('aria-expanded', 'false'),
    )
  })
  it('shows an error message when the create request fails', async () => {
    const user = userEvent.setup()
    fetchMock.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Internal server error' }),
      }),
    )

    renderDialog(queryClient)

    await user.click(screen.getByRole('button', { name: 'Add Application' }))
    await user.type(
      await screen.findByRole('textbox', { name: 'Title' }),
      'Senior Backend Engineer',
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Company' }),
      'Acme Corp',
    )
    await user.click(screen.getByRole('button', { name: 'Create' }))

    expect(
      await screen.findByText('Internal server error'),
    ).toBeInTheDocument()
  })

  it('sends the selected company id when an existing company is chosen', async () => {
    const user = userEvent.setup()
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/companies/search')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([{ id: 'company-1', name: 'Acme Corp' }]),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: '1' }),
      })
    })

    renderDialog(queryClient)

    await user.click(screen.getByRole('button', { name: 'Add Application' }))
    await user.type(
      await screen.findByRole('textbox', { name: 'Title' }),
      'Senior Backend Engineer',
    )
    await user.type(screen.getByRole('textbox', { name: 'Company' }), 'Acme')
    await user.click(await screen.findByRole('button', { name: 'Acme Corp' }))
    await user.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => {
      const createCall = fetchMock.mock.calls.find(
        ([url, options]) =>
          (options as RequestInit | undefined)?.method === 'POST' &&
          !url.includes('companies/search'),
      )
      const body = JSON.parse(createCall?.[1]?.body as string)
      expect(body.companyId).toBe('company-1')
    })
  })

  it("defaults the currency select to the user's preferred currency when set", async () => {
    const user = userEvent.setup()
    queryClient.setQueryData(userQueryOptions.queryKey, {
      id: '1',
      email: 'jane@example.com',
      defaultCurrency: 'USD',
      createdAt: '2026-01-01T00:00:00.000Z',
    })
    renderDialog(queryClient)

    await user.click(screen.getByRole('button', { name: 'Add Application' }))

    expect(
      await screen.findByRole('combobox', { name: 'Currency' }),
    ).toHaveTextContent('USD')
  })

  it('sends the default currency (EUR) when creating an application', async () => {
    const user = userEvent.setup()
    renderDialog(queryClient)

    await user.click(screen.getByRole('button', { name: 'Add Application' }))
    await user.type(
      await screen.findByRole('textbox', { name: 'Title' }),
      'Senior Backend Engineer',
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Company' }),
      'Acme Corp',
    )
    await user.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => {
      const createCall = fetchMock.mock.calls.find(
        ([url, options]) =>
          (options as RequestInit | undefined)?.method === 'POST' &&
          !url.includes('companies/search'),
      )
      const body = JSON.parse(createCall?.[1]?.body as string)
      expect(body.currency).toBe('EUR')
    })
  })

  it('sends the selected currency when changed', async () => {
    const user = userEvent.setup()
    renderDialog(queryClient)

    await user.click(screen.getByRole('button', { name: 'Add Application' }))
    await user.type(
      await screen.findByRole('textbox', { name: 'Title' }),
      'Senior Backend Engineer',
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Company' }),
      'Acme Corp',
    )
    await user.click(screen.getByRole('combobox', { name: 'Currency' }))
    await user.click(await screen.findByRole('option', { name: 'USD' }))
    await user.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => {
      const createCall = fetchMock.mock.calls.find(
        ([url, options]) =>
          (options as RequestInit | undefined)?.method === 'POST' &&
          !url.includes('companies/search'),
      )
      const body = JSON.parse(createCall?.[1]?.body as string)
      expect(body.currency).toBe('USD')
    })
  })
})
