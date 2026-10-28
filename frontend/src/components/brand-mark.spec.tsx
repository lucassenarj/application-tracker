import { render } from '@testing-library/react'
import { BrandMark } from '@/components/brand-mark'

describe('BrandMark', () => {
  it('renders at the default size when no size is given', () => {
    const { container } = render(<BrandMark />)

    expect(container.firstChild).toHaveStyle({ width: '36px', height: '36px' })
  })

  it('renders at a custom size when provided', () => {
    const { container } = render(<BrandMark size={70} />)

    expect(container.firstChild).toHaveStyle({ width: '70px', height: '70px' })
  })
  it('is hidden from assistive technology, since adjacent text already conveys the brand name', () => {
    const { container } = render(<BrandMark />)

    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })
})
