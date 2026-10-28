import type { ComponentProps } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChangeStatusDialog } from '@/components/change-status-dialog'
import type { ApplicationStatus } from '@/lib/applications/applications-list'
import { fetchMock } from '@/test-setup'

function renderDialog(
  queryClient: QueryClient,
  availableTransitions: ApplicationStatus[] = ['OFFER', 'REJECTED'],
  extraProps: Partial<
    Omit<
      ComponentProps<typeof ChangeStatusDialog>,
      'applicationId' | 'availableTransitions'
    >
  > = {},
) {
  return render(
    <QueryClientProvider client={queryClient}>
      <ChangeStatusDialog
        applicationId="abc123"
        availableTransitions={availableTransitions}
        {...extraProps}
      />
    </QueryClientProvider>,
  )
}

describe('ChangeStatusDialog', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    fetchMock.mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
    )
  })

  it('renders a "Change Status" trigger button', () => {
    renderDialog(queryClient)

    expect(
      screen.getByRole('button', { name: 'Change Status' }),
    ).toBeInTheDocument()
  })

  it('opens the dialog with a status select, offering exactly the statuses passed via availableTransitions', async () => {
    const user = userEvent.setup()
    renderDialog(queryClient, ['OFFER', 'REJECTED'])

    await user.click(screen.getByRole('button', { name: 'Change Status' }))
    await user.click(await screen.findByRole('combobox'))

    expect(
      await screen.findByRole('option', { name: 'Offer' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('option', { name: 'Rejected' }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(2)
  })

  it('does not render a trigger when there are no available transitions (terminal status) and open is uncontrolled', () => {
    renderDialog(queryClient, [])

    expect(
      screen.queryByRole('button', { name: 'Change Status' }),
    ).not.toBeInTheDocument()
  })

  it('does not show the interview category choice when no status, or a non-interview status, is selected', async () => {
    const user = userEvent.setup()
    renderDialog(queryClient, ['OFFER', 'INTERVIEW_SCHEDULED'])

    await user.click(screen.getByRole('button', { name: 'Change Status' }))

    expect(
      screen.queryByRole('combobox', { name: 'Interview Category' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('combobox', { name: 'Status' }))
    await user.click(await screen.findByRole('option', { name: 'Offer' }))

    expect(
      screen.queryByRole('combobox', { name: 'Interview Category' }),
    ).not.toBeInTheDocument()
  })

  it('shows a Technical / Non-technical choice when INTERVIEW_SCHEDULED is selected', async () => {
    const user = userEvent.setup()
    renderDialog(queryClient, ['INTERVIEW_SCHEDULED'])

    await user.click(screen.getByRole('button', { name: 'Change Status' }))
    await user.click(screen.getByRole('combobox', { name: 'Status' }))
    await user.click(
      await screen.findByRole('option', { name: 'Interview Scheduled' }),
    )

    await user.click(
      await screen.findByRole('combobox', { name: 'Interview Category' }),
    )

    expect(
      await screen.findByRole('option', { name: 'Technical' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('option', { name: 'Non-technical' }),
    ).toBeInTheDocument()
  })

  it('hides the interview category choice again if the selection changes away from INTERVIEW_SCHEDULED', async () => {
    const user = userEvent.setup()
    renderDialog(queryClient, ['INTERVIEW_SCHEDULED', 'OFFER'])

    await user.click(screen.getByRole('button', { name: 'Change Status' }))
    await user.click(screen.getByRole('combobox', { name: 'Status' }))
    await user.click(
      await screen.findByRole('option', { name: 'Interview Scheduled' }),
    )

    expect(
      await screen.findByRole('combobox', { name: 'Interview Category' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('combobox', { name: 'Status' }))
    await user.click(await screen.findByRole('option', { name: 'Offer' }))

    expect(
      screen.queryByRole('combobox', { name: 'Interview Category' }),
    ).not.toBeInTheDocument()
  })

  it("renders a date input defaulted to today's date", async () => {
    const user = userEvent.setup()
    renderDialog(queryClient, ['OFFER'])

    await user.click(screen.getByRole('button', { name: 'Change Status' }))

    const todayIso = new Date().toISOString().slice(0, 10)
    expect(await screen.findByLabelText('Event Date')).toHaveValue(todayIso)
  })

  it('renders optional contact name, contact email, and notes fields', async () => {
    const user = userEvent.setup()
    renderDialog(queryClient, ['OFFER'])

    await user.click(screen.getByRole('button', { name: 'Change Status' }))

    expect(
      await screen.findByRole('textbox', { name: 'Contact Name' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: 'Contact Email' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Notes' })).toBeInTheDocument()
  })

  it('shows a validation error when the date is cleared', async () => {
    const user = userEvent.setup()
    renderDialog(queryClient, ['OFFER'])

    await user.click(screen.getByRole('button', { name: 'Change Status' }))
    await user.click(screen.getByRole('combobox', { name: 'Status' }))
    await user.click(await screen.findByRole('option', { name: 'Offer' }))
    await user.clear(screen.getByLabelText('Event Date'))
    await user.click(screen.getByRole('button', { name: 'Update Status' }))

    expect(await screen.findByText('Date is required')).toBeInTheDocument()
  })

  it('shows a validation error for an invalid contact email', async () => {
    const user = userEvent.setup()
    renderDialog(queryClient, ['OFFER'])

    await user.click(screen.getByRole('button', { name: 'Change Status' }))
    await user.click(screen.getByRole('combobox', { name: 'Status' }))
    await user.click(await screen.findByRole('option', { name: 'Offer' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Contact Email' }),
      'not-an-email',
    )
    await user.click(screen.getByRole('button', { name: 'Update Status' }))

    expect(
      await screen.findByText('Enter a valid email'),
    ).toBeInTheDocument()
  })

  it('submits the PATCH request with status, date, interview category, contact, and notes, and closes the dialog on success', async () => {
    const user = userEvent.setup()
    renderDialog(queryClient, ['INTERVIEW_SCHEDULED'])

    const trigger = screen.getByRole('button', { name: 'Change Status' })
    await user.click(trigger)

    await user.click(screen.getByRole('combobox', { name: 'Status' }))
    await user.click(
      await screen.findByRole('option', { name: 'Interview Scheduled' }),
    )
    await user.click(
      await screen.findByRole('combobox', { name: 'Interview Category' }),
    )
    await user.click(await screen.findByRole('option', { name: 'Technical' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Contact Name' }),
      'Jane Recruiter',
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Contact Email' }),
      'jane@example.com',
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Notes' }),
      'Went well',
    )

    await user.click(screen.getByRole('button', { name: 'Update Status' }))

    await waitFor(() =>
      expect(trigger).toHaveAttribute('aria-expanded', 'false'),
    )

    const patchCall = fetchMock.mock.calls.find(([url]) =>
      (url as string).includes('/applications/abc123/status'),
    )
    const body = JSON.parse(patchCall?.[1]?.body as string)
    expect(body).toMatchObject({
      status: 'INTERVIEW_SCHEDULED',
      interviewCategory: 'TECHNICAL',
      contactName: 'Jane Recruiter',
      contactEmail: 'jane@example.com',
      notes: 'Went well',
    })
  })

  it('shows an error message when the request fails', async () => {
    const user = userEvent.setup()
    fetchMock.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Internal server error' }),
      }),
    )

    renderDialog(queryClient, ['OFFER'])

    await user.click(screen.getByRole('button', { name: 'Change Status' }))
    await user.click(screen.getByRole('combobox', { name: 'Status' }))
    await user.click(await screen.findByRole('option', { name: 'Offer' }))
    await user.click(screen.getByRole('button', { name: 'Update Status' }))

    expect(
      await screen.findByText('Internal server error'),
    ).toBeInTheDocument()
  })

  describe('controlled mode', () => {
    it('does not render its own trigger button when open is controlled externally', () => {
      renderDialog(queryClient, ['OFFER'], { open: true, onOpenChange: vi.fn() })

      expect(
        screen.queryByRole('button', { name: 'Change Status' }),
      ).not.toBeInTheDocument()
    })

    it('pre-fills the status select from initialStatus when opened', async () => {
      renderDialog(queryClient, ['OFFER', 'REJECTED'], {
        open: true,
        onOpenChange: vi.fn(),
        initialStatus: 'OFFER',
      })

      expect(
        await screen.findByRole('combobox', { name: 'Status' }),
      ).toHaveTextContent('Offer')
    })

    it('calls onSuccess after a successful save', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      renderDialog(queryClient, ['OFFER'], {
        open: true,
        onOpenChange: vi.fn(),
        initialStatus: 'OFFER',
        onSuccess,
      })

      await user.click(
        await screen.findByRole('button', { name: 'Update Status' }),
      )

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })
  })
})
