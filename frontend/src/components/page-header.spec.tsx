import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import { PageHeader } from '@/components/page-header'
import { buildRouteTree } from '@/test-utils/build-route-tree'
import { renderWithRouter } from '@/test-utils/render-with-router'

const routeTree = buildRouteTree({
  '/applications': () => <PageHeader title="Applications" />,
  '/applications/detail': () => (
    <PageHeader
      title="Detail"
      parent={{
        label: 'Applications',
        to: '/applications',
        search: { page: 1 },
      }}
    />
  ),
  '/dashboard': () => <div>Dashboard page</div>,
})

describe('PageHeader', () => {
  it('renders the title', async () => {
    const queryClient = new QueryClient()
    renderWithRouter(routeTree, queryClient, '/applications')

    expect(
      await screen.findByRole('heading', { name: 'Applications' }),
    ).toBeInTheDocument()
  })

  it('renders a breadcrumb link to Dashboard', async () => {
    const queryClient = new QueryClient()
    renderWithRouter(routeTree, queryClient, '/applications')

    expect(
      await screen.findByRole('link', { name: 'Dashboard' }),
    ).toHaveAttribute('href', '/dashboard')
  })
  it('renders an additional parent crumb when provided', async () => {
    const queryClient = new QueryClient()
    renderWithRouter(routeTree, queryClient, '/applications/detail')

    expect(
      await screen.findByRole('link', { name: 'Applications' }),
    ).toHaveAttribute('href', '/applications?page=1')
  })
})
