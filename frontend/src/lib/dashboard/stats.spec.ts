import { categoryBreakdown } from '@/lib/dashboard/stats'

describe('categoryBreakdown', () => {
  it('returns a percentage for each category, summing to 100', () => {
    const result = categoryBreakdown({
      total: 9,
      inProgress: 3,
      offers: 3,
      rejections: 3,
    })

    const totalPercentage = result.reduce(
      (sum, item) => sum + item.percentage,
      0,
    )
    expect(totalPercentage).toBe(100)
  })

  it('returns 0% for every category when total is 0', () => {
    const result = categoryBreakdown({
      total: 0,
      inProgress: 0,
      offers: 0,
      rejections: 0,
    })

    expect(result.every((item) => item.percentage === 0)).toBe(true)
  })

  it('rounds percentages to the nearest whole number', () => {
    const result = categoryBreakdown({
      total: 7,
      inProgress: 5,
      offers: 1,
      rejections: 1,
    })

    expect(result.every((item) => Number.isInteger(item.percentage))).toBe(
      true,
    )
  })
})
