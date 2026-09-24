import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRootRoute, createRoute } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import { ApplicationsPage } from '@/pages/applications-page'
import { applicationsSearchSchema } from '@/routes/applications'
import { renderWithRouter } from '@/test-utils/render-with-router'

const rootRoute = createRootRoute()
const applicationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/applications',
  validateSearch: zodValidator(applicationsSearchSchema),
  component: ApplicationsPage,
})
const applicationDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/applications/$id',
  component: () => <div>Application Detail page</div>,
})
const routeTree = rootRoute.addChildren([
  applicationsRoute,
  applicationDetailRoute,
])

describe('ApplicationsPage', () => {
  let queryClient: QueryClient
  const fetchMock = vi.fn()

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    vi.stubEnv('VITE_API_URL', 'https://api.example.com')
    fetchMock.mockReset()
    fetchMock.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ items: [], total: 0 }),
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  describe('table', () => {
    it('renders loading skeletons while pending', async () => {
      fetchMock.mockImplementation(() => new Promise(() => {}))

      const { container } = renderWithRouter(
        routeTree,
        queryClient,
        '/applications?page=1',
      )

      await screen.findByText('Applications')
      expect(
        container.querySelectorAll('[data-slot="skeleton"]').length,
      ).toBeGreaterThan(0)
    })

    it("renders each application's title, company name, formatted status, and date", async () => {
      const items = [
        {
          id: '1',
          title: 'Senior Backend Engineer',
          companyName: 'Acme Corp',
          currentStatus: 'INTERVIEW_SCHEDULED',
          createdAt: '2026-01-15T10:00:00.000Z',
        },
        {
          id: '2',
          title: 'Frontend Developer',
          companyName: 'Globex',
          currentStatus: 'APPLIED',
          createdAt: '2026-02-01T10:00:00.000Z',
        },
      ]
      fetchMock.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ items, total: items.length }),
        }),
      )

      renderWithRouter(routeTree, queryClient, '/applications?page=1')

      expect(
        await screen.findByText('Senior Backend Engineer'),
      ).toBeInTheDocument()
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
      expect(screen.getByText('Interview Scheduled')).toBeInTheDocument()
      expect(
        screen.getByText(new Date(items[0].createdAt).toLocaleDateString()),
      ).toBeInTheDocument()

      expect(screen.getByText('Frontend Developer')).toBeInTheDocument()
      expect(screen.getByText('Globex')).toBeInTheDocument()
      expect(screen.getByText('Applied')).toBeInTheDocument()
      expect(
        screen.getByText(new Date(items[1].createdAt).toLocaleDateString()),
      ).toBeInTheDocument()
    })
    it('shows "No applications yet." when the list is empty', async () => {
      renderWithRouter(routeTree, queryClient, '/applications?page=1')

      expect(
        await screen.findByText('No applications yet.'),
      ).toBeInTheDocument()
    })
    it('shows an error message when the request fails', async () => {
      fetchMock.mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ message: 'Internal server error' }),
        }),
      )

      renderWithRouter(routeTree, queryClient, '/applications?page=1')

      expect(
        await screen.findByText(
          "Couldn't load your applications. Try refreshing the page.",
        ),
      ).toBeInTheDocument()
    })
  })

  describe('status filter', () => {
    it('renders all status options plus an "All statuses" option', async () => {
      const user = userEvent.setup()
      renderWithRouter(routeTree, queryClient, '/applications?page=1')

      await user.click(await screen.findByRole('combobox'))

      expect(
        await screen.findByRole('option', { name: 'All statuses' }),
      ).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Applied' })).toBeInTheDocument()
      expect(
        screen.getByRole('option', { name: 'Waiting Feedback' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('option', { name: 'Assignment' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('option', { name: 'Interview Scheduled' }),
      ).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Offer' })).toBeInTheDocument()
      expect(
        screen.getByRole('option', { name: 'Offer Accepted' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('option', { name: 'Offer Declined' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('option', { name: 'Rejected' }),
      ).toBeInTheDocument()
    })
    it('selecting a status filters the list and resets to page 1', async () => {
      const user = userEvent.setup()

      renderWithRouter(routeTree, queryClient, '/applications?page=2')

      await user.click(await screen.findByRole('combobox'))
      await user.click(await screen.findByRole('option', { name: 'Offer' }))

      await screen.findByText('No applications yet.')

      const lastCallUrl = fetchMock.mock.calls.at(-1)?.[0] as string
      expect(lastCallUrl).toContain('page=1')
      expect(lastCallUrl).toContain('status=OFFER')
    })

    it('replaces the history entry instead of pushing a new one when filtering', async () => {
      const user = userEvent.setup()

      const { router } = renderWithRouter(
        routeTree,
        queryClient,
        '/applications?page=1',
      )

      await user.click(await screen.findByRole('combobox'))
      await user.click(await screen.findByRole('option', { name: 'Offer' }))
      await screen.findByText('No applications yet.')

      await user.click(await screen.findByRole('combobox'))
      await user.click(await screen.findByRole('option', { name: 'Rejected' }))
      await screen.findByText('No applications yet.')

      expect(router.history.length).toBe(1)
    })
  })

  describe('pagination', () => {
    beforeEach(() => {
      fetchMock.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              items: [
                {
                  id: '1',
                  title: 'Senior Backend Engineer',
                  companyName: 'Acme Corp',
                  currentStatus: 'APPLIED',
                  createdAt: '2026-01-15T10:00:00.000Z',
                },
              ],
              total: 25,
            }),
        }),
      )
    })

    it('disables the Previous button on page 1', async () => {
      renderWithRouter(routeTree, queryClient, '/applications?page=1')

      await screen.findByText('Senior Backend Engineer')

      expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    })
    it('disables the Next button on the last page', async () => {
      renderWithRouter(routeTree, queryClient, '/applications?page=3')

      await screen.findByText('Senior Backend Engineer')

      expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    })
    it('clicking Next advances to page 2', async () => {
      const user = userEvent.setup()

      renderWithRouter(routeTree, queryClient, '/applications?page=1')

      await screen.findByText('Page 1 of 3')
      await user.click(screen.getByRole('button', { name: 'Next' }))

      expect(await screen.findByText('Page 2 of 3')).toBeInTheDocument()
    })
  })

  it("clicking a row navigates to the application's detail page", async () => {
    const user = userEvent.setup()
    fetchMock.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [
              {
                id: 'abc123',
                title: 'Senior Backend Engineer',
                companyName: 'Acme Corp',
                currentStatus: 'APPLIED',
                createdAt: '2026-01-15T10:00:00.000Z',
              },
            ],
            total: 1,
          }),
      }),
    )

    renderWithRouter(routeTree, queryClient, '/applications?page=1')

    await user.click(await screen.findByText('Senior Backend Engineer'))

    expect(
      await screen.findByText('Application Detail page'),
    ).toBeInTheDocument()
  })
})
