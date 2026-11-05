import { QueryClient } from '@tanstack/react-query'
import { screen, waitFor } from '@testing-library/react'
import { createRootRoute, createRoute } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import { z } from 'zod'
import { VerifyEmailPage } from '@/pages/verify-email-page'
import { fetchMock } from '@/test-setup'
import { renderWithRouter } from '@/test-utils/render-with-router'

const verifyEmailSearchSchema = z.object({
  token: z.string().optional(),
})

const rootRoute = createRootRoute()
const verifyEmailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/verify-email',
  validateSearch: zodValidator(verifyEmailSearchSchema),
  component: VerifyEmailPage,
})
const routeTree = rootRoute.addChildren([verifyEmailRoute])

describe('VerifyEmailPage', () => {
  it('submits the token from the URL to POST /auth/verify-email automatically on mount, without any user interaction', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
    )

    renderWithRouter(routeTree, new QueryClient(), '/verify-email?token=abc123')

    await waitFor(() => {
      const call = fetchMock.mock.calls.find(([url]) =>
        (url as string).includes('/auth/verify-email'),
      )
      expect(call).toBeDefined()
      expect(JSON.parse(call?.[1]?.body as string)).toEqual({
        token: 'abc123',
      })
    })
  })

  it('shows a pending state while the request is in flight', async () => {
    fetchMock.mockImplementation(() => new Promise(() => {}))

    renderWithRouter(routeTree, new QueryClient(), '/verify-email?token=abc123')

    expect(
      await screen.findByRole('status', { name: 'Loading' }),
    ).toBeInTheDocument()
  })

  it('shows a success message and a link to login after successful verification', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
    )

    renderWithRouter(routeTree, new QueryClient(), '/verify-email?token=abc123')

    expect(
      await screen.findByText('Your email has been verified.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign In' })).toHaveAttribute(
      'href',
      '/login',
    )
  })

  it('shows the backend error message and a link to register when the token is invalid or expired', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({ message: 'invalid or expired verification token' }),
      }),
    )

    renderWithRouter(routeTree, new QueryClient(), '/verify-email?token=abc123')

    expect(
      await screen.findByText('invalid or expired verification token'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Register again' }),
    ).toHaveAttribute('href', '/register')
  })
})
