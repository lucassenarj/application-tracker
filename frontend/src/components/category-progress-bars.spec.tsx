import { render, screen } from '@testing-library/react'
import { CategoryProgressBars } from '@/components/category-progress-bars'

describe('CategoryProgressBars', () => {
  it('shows each category label and percentage', () => {
    render(
      <CategoryProgressBars
        stats={{ total: 10, inProgress: 5, offers: 3, rejections: 2 }}
      />,
    )

    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('Offers')).toBeInTheDocument()
    expect(screen.getByText('30%')).toBeInTheDocument()
    expect(screen.getByText('Rejections')).toBeInTheDocument()
    expect(screen.getByText('20%')).toBeInTheDocument()
  })

  it('sets each bar width to match its percentage', () => {
    render(
      <CategoryProgressBars
        stats={{ total: 10, inProgress: 5, offers: 3, rejections: 2 }}
      />,
    )

    expect(screen.getByTestId('progress-IN_PROGRESS-fill')).toHaveStyle({
      width: '50%',
    })
    expect(screen.getByTestId('progress-OFFERS-fill')).toHaveStyle({
      width: '30%',
    })
    expect(screen.getByTestId('progress-REJECTIONS-fill')).toHaveStyle({
      width: '20%',
    })
  })
})
