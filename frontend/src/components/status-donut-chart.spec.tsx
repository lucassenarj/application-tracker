import { render, screen } from '@testing-library/react'
import { StatusDonutChart } from '@/components/status-donut-chart'

describe('StatusDonutChart', () => {
  it('shows the total application count in the center', () => {
    render(
      <StatusDonutChart
        stats={{ total: 10, inProgress: 5, offers: 3, rejections: 2 }}
      />,
    )

    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('shows each category label and percentage in the legend', () => {
    render(
      <StatusDonutChart
        stats={{ total: 10, inProgress: 5, offers: 3, rejections: 2 }}
      />,
    )

    expect(screen.getByText('In Progress (50%)')).toBeInTheDocument()
    expect(screen.getByText('Offers (30%)')).toBeInTheDocument()
    expect(screen.getByText('Rejections (20%)')).toBeInTheDocument()
  })
})
