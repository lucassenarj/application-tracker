import { QueryClient } from '@tanstack/react-query'
import { screen, within } from '@testing-library/react'
import { buildRouteTree } from '@/test-utils/build-route-tree'
import { renderWithRouter } from '@/test-utils/render-with-router'
import { LandingPage } from '@/pages/landing-page'
import { fetchMock } from '@/test-setup'

const routeTree = buildRouteTree({
  '/': LandingPage,
  '/login': () => <div>Login page</div>,
  '/register': () => <div>Register page</div>,
  '/dashboard': () => <div>Dashboard page</div>,
})

describe('LandingPage', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    fetchMock.mockImplementation(() =>
      Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) }),
    )
  })

  it('renders the hero headline immediately, without waiting on the auth check', async () => {
    fetchMock.mockImplementation(() => new Promise(() => {}))

    renderWithRouter(routeTree, queryClient, '/')

    expect(
      await screen.findByText('Every application. One place. Zero spreadsheets.'),
    ).toBeInTheDocument()
  })

  it('shows a "Go to Dashboard" link instead of auto-redirecting when logged in', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: '1', email: 'jane@example.com' }),
      }),
    )

    renderWithRouter(routeTree, queryClient, '/')

    expect(
      await screen.findByRole('button', { name: 'Go to Dashboard' }),
    ).toHaveAttribute('href', '/dashboard')
    expect(
      screen.getByText('Every application. One place. Zero spreadsheets.'),
    ).toBeInTheDocument()
  })

  it('renders all four feature highlights', async () => {
    renderWithRouter(routeTree, queryClient, '/')

    expect(
      await screen.findByRole('heading', { name: 'Track every stage' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Never miss an interview' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: 'Tag applications with what matters to you',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Your search, at a glance' }),
    ).toBeInTheDocument()
  })

  it('renders all three product tour screens', async () => {
    renderWithRouter(routeTree, queryClient, '/')

    expect(
      await screen.findByRole('heading', { name: 'Dashboard' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Applications List' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Application Detail' }),
    ).toBeInTheDocument()
  })

  it('renders the "Why I built this" section', async () => {
    renderWithRouter(routeTree, queryClient, '/')

    expect(
      await screen.findByRole('heading', { name: 'Why I built this' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/job searching gets messy fast/),
    ).toBeInTheDocument()
  })

  it('renders Login and Register links in the footer', async () => {
    renderWithRouter(routeTree, queryClient, '/')

    const footerNav = within(
      await screen.findByRole('navigation', { name: 'Footer' }),
    )
    expect(footerNav.getByRole('link', { name: 'Log in' })).toBeInTheDocument()
    expect(
      footerNav.getByRole('link', { name: 'Register' }),
    ).toBeInTheDocument()
  })
  it('renders a link to the GitHub repo in the footer', async () => {
    renderWithRouter(routeTree, queryClient, '/')

    const footerNav = within(
      await screen.findByRole('navigation', { name: 'Footer' }),
    )
    expect(footerNav.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/lucassenarj/application-tracker',
    )
  })
  it('renders the current app version in the footer', async () => {
    renderWithRouter(routeTree, queryClient, '/')

    expect(await screen.findByText(/v\d+\.\d+\.\d+/)).toBeInTheDocument()
  })
})
