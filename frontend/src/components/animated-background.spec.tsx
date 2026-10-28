import { render } from '@testing-library/react'
import { AnimatedBackground } from '@/components/animated-background'

describe('AnimatedBackground', () => {
  it('renders without crashing', () => {
    render(<AnimatedBackground />)
  })

  it('is hidden from assistive technology (aria-hidden), so it never pollutes the a11y tree', () => {
    const { container } = render(<AnimatedBackground />)

    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })
})
