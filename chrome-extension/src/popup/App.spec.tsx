import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { setStoredToken } from '@/lib/token-storage'
import {
  fetchMock,
  chromeTabsQueryMock,
  chromeTabsSendMessageMock,
  chromeRuntimeOpenOptionsPageMock,
} from '@/test-setup'

const EXTRACTED_JOB_POSTING = {
  title: 'Software Engineer',
  companyName: 'Acme',
  description: 'Great job',
  skills: 'Java, AWS',
  externalUrl: 'https://www.linkedin.com/jobs/view/123',
}

function mockActiveTab() {
  chromeTabsQueryMock.mockResolvedValue([{ id: 42 } as chrome.tabs.Tab])
}

async function renderWithExtractedJobPosting() {
  await setStoredToken('my-token')
  mockActiveTab()
  chromeTabsSendMessageMock.mockResolvedValue(EXTRACTED_JOB_POSTING)
  const user = userEvent.setup()
  render(<App />)
  await screen.findByLabelText('Title')
  return user
}

describe('Popup App', () => {
  it('shows the no-token state with an "Open Settings" button when no PAT is stored', async () => {
    render(<App />)

    expect(await screen.findByText(/no token configured/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open Settings' })).toBeInTheDocument()
  })

  it('clicking "Open Settings" in the no-token state opens the options page', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText(/no token configured/i)

    await user.click(screen.getByRole('button', { name: 'Open Settings' }))

    expect(chromeRuntimeOpenOptionsPageMock).toHaveBeenCalled()
  })

  it('shows the unsupported-page state when extraction returns nothing', async () => {
    await setStoredToken('my-token')
    mockActiveTab()
    chromeTabsSendMessageMock.mockRejectedValue(new Error('no receiver'))

    render(<App />)

    expect(
      await screen.findByText(/open a linkedin job posting/i),
    ).toBeInTheDocument()
  })

  it('shows the form pre-filled with the extracted fields when extraction succeeds', async () => {
    await renderWithExtractedJobPosting()

    expect(screen.getByLabelText('Title')).toHaveValue('Software Engineer')
    expect(screen.getByLabelText('Company')).toHaveValue('Acme')
    expect(screen.getByLabelText('Description')).toHaveValue('Great job')
    expect(screen.getByLabelText('Skills')).toHaveValue('Java, AWS')
  })

  it('submitting the form sends the trimmed/split skills and the extracted externalUrl', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ id: 'app-1' }),
    })
    const user = await renderWithExtractedJobPosting()

    await user.click(screen.getByRole('button', { name: 'Capture' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/external/applications'),
        expect.objectContaining({
          body: JSON.stringify({
            title: 'Software Engineer',
            description: 'Great job',
            externalUrl: 'https://www.linkedin.com/jobs/view/123',
            companyName: 'Acme',
            skills: ['Java', 'AWS'],
          }),
        }),
      )
    })
  })

  it('shows the success state with a link to the new application on a 201 response', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ id: 'app-1' }),
    })
    const user = await renderWithExtractedJobPosting()

    await user.click(screen.getByRole('button', { name: 'Capture' }))

    const link = await screen.findByRole('link', { name: /view application/i })
    expect(link).toHaveAttribute(
      'href',
      `${import.meta.env.VITE_FRONTEND_URL}/applications/app-1`,
    )
  })

  it('shows the already-captured state with a link to the existing application on a 200 response', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 'app-1' }),
    })
    const user = await renderWithExtractedJobPosting()

    await user.click(screen.getByRole('button', { name: 'Capture' }))

    expect(await screen.findByText(/already captured/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /view application/i })).toHaveAttribute(
      'href',
      `${import.meta.env.VITE_FRONTEND_URL}/applications/app-1`,
    )
  })

  it('shows an error and keeps the form values on a failed submission', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: 'companyName should not be empty' }),
    })
    const user = await renderWithExtractedJobPosting()

    await user.click(screen.getByRole('button', { name: 'Capture' }))

    expect(
      await screen.findByText('companyName should not be empty'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toHaveValue('Software Engineer')
  })

  it('shows a persistent Settings button in the form state that opens the options page', async () => {
    const user = await renderWithExtractedJobPosting()

    await user.click(screen.getByRole('button', { name: 'Settings' }))

    expect(chromeRuntimeOpenOptionsPageMock).toHaveBeenCalled()
  })
})
