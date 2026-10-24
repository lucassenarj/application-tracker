import { render } from '@testing-library/react'
import { SkeletonList } from '@/components/skeleton-list'

describe('SkeletonList', () => {
  it('renders 5 skeleton items by default', () => {
    const { container } = render(<SkeletonList />)

    expect(
      container.querySelectorAll('[data-slot="skeleton"]'),
    ).toHaveLength(5)
  })

  it('renders the given number of skeleton items when count is passed', () => {
    const { container } = render(<SkeletonList count={8} />)

    expect(
      container.querySelectorAll('[data-slot="skeleton"]'),
    ).toHaveLength(8)
  })
})
