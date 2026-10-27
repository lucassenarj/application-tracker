import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConsentBanner } from '@/components/consent-banner'
import { getStoredConsent, setStoredConsent } from '@/lib/analytics'

describe('ConsentBanner', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    localStorage.clear()
    document.head.innerHTML = ''
    window.dataLayer = undefined
    window.gtag = undefined
  })

  it('renders nothing when analytics is not configured', () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', '')

    render(<ConsentBanner />)

    expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument()
  })

  it('renders nothing when a consent decision is already stored', () => {
    setStoredConsent('accepted')

    render(<ConsentBanner />)

    expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument()
  })

  it('initializes analytics on mount when a previous "accepted" decision is already stored', () => {
    setStoredConsent('accepted')

    render(<ConsentBanner />)

    expect(document.head.querySelector('script[src*="gtag/js"]')).not.toBeNull()
  })

  it('shows Accept and Decline buttons when configured and no decision stored', () => {
    render(<ConsentBanner />)

    expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Decline' })).toBeInTheDocument()
  })

  it('clicking Accept stores the decision, initializes analytics, and hides the banner', async () => {
    const user = userEvent.setup()
    render(<ConsentBanner />)

    await user.click(screen.getByRole('button', { name: 'Accept' }))

    expect(getStoredConsent()).toBe('accepted')
    expect(document.head.querySelector('script[src*="gtag/js"]')).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument()
  })

  it('clicking Decline stores the decision and hides the banner without initializing analytics', async () => {
    const user = userEvent.setup()
    render(<ConsentBanner />)

    await user.click(screen.getByRole('button', { name: 'Decline' }))

    expect(getStoredConsent()).toBe('declined')
    expect(document.head.querySelector('script[src*="gtag/js"]')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Decline' })).not.toBeInTheDocument()
  })
})
