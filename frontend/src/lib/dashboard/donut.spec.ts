import { computeDonutSegments } from '@/lib/dashboard/donut'
import type { CategoryBreakdownItem } from '@/lib/dashboard/stats'

const breakdown: CategoryBreakdownItem[] = [
  { category: 'IN_PROGRESS', count: 5, percentage: 50 },
  { category: 'OFFERS', count: 3, percentage: 30 },
  { category: 'REJECTIONS', count: 2, percentage: 20 },
]

describe('computeDonutSegments', () => {
  it('returns one segment per breakdown item', () => {
    const result = computeDonutSegments(breakdown)

    expect(result).toHaveLength(3)
  })

  it('computes a dasharray matching the percentage of a 54px-radius circle', () => {
    const result = computeDonutSegments(breakdown)
    const circumference = 2 * Math.PI * 54

    const [length, total] = result[0].dasharray.split(' ').map(Number)
    expect(length).toBeCloseTo((50 / 100) * circumference)
    expect(total).toBeCloseTo(circumference)
  })
  it('offsets each segment by the cumulative length of preceding segments', () => {
    const result = computeDonutSegments(breakdown)

    const [firstLength] = result[0].dasharray.split(' ').map(Number)
    const [secondLength] = result[1].dasharray.split(' ').map(Number)

    expect(result[0].dashoffset).toBeCloseTo(0)
    expect(result[1].dashoffset).toBeCloseTo(-firstLength)
    expect(result[2].dashoffset).toBeCloseTo(-(firstLength + secondLength))
  })
})
