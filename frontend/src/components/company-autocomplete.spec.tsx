import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { CompanyAutocomplete } from '@/components/company-autocomplete'
import { fetchMock } from '@/test-setup'

function ControlledWrapper({
  onChange,
}: {
  onChange: (company: { name: string; companyId?: string }) => void
}) {
  const [value, setValue] = useState('')
  return (
    <CompanyAutocomplete
      value={value}
      onChange={(next) => {
        setValue(next.name)
        onChange(next)
      }}
    />
  )
}

describe('CompanyAutocomplete', () => {
  let queryClient: QueryClient
  const onChange = vi.fn()

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    onChange.mockReset()
    fetchMock.mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),
    )
  })

  it('renders suggestions returned by the search query', async () => {
    const user = userEvent.setup()
    fetchMock.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            { id: '1', name: 'Acme Corp' },
            { id: '2', name: 'Acme Industries' },
          ]),
      }),
    )

    render(
      <QueryClientProvider client={queryClient}>
        <ControlledWrapper onChange={onChange} />
      </QueryClientProvider>,
    )

    await user.type(screen.getByRole('textbox'), 'Acme')

    expect(
      await screen.findByRole('button', { name: 'Acme Corp' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Acme Industries' }),
    ).toBeInTheDocument()
  })

  it('selecting a suggestion calls onChange with the company name and closes the list', async () => {
    const user = userEvent.setup()
    fetchMock.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ id: '1', name: 'Acme Corp' }]),
      }),
    )

    render(
      <QueryClientProvider client={queryClient}>
        <ControlledWrapper onChange={onChange} />
      </QueryClientProvider>,
    )

    await user.type(screen.getByRole('textbox'), 'Acme')
    await user.click(await screen.findByRole('button', { name: 'Acme Corp' }))

    expect(onChange).toHaveBeenLastCalledWith({
      name: 'Acme Corp',
      companyId: '1',
    })
    expect(
      screen.queryByRole('button', { name: 'Acme Corp' }),
    ).not.toBeInTheDocument()
  })
  it('shows no suggestions when the query returns an empty list', async () => {
    const user = userEvent.setup()
    fetchMock.mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),
    )

    render(
      <QueryClientProvider client={queryClient}>
        <ControlledWrapper onChange={onChange} />
      </QueryClientProvider>,
    )

    await user.type(screen.getByRole('textbox'), 'Zzz')

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})
