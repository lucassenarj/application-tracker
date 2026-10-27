import { getChartTicks } from '@/lib/dashboard/chart-ticks'

describe('getChartTicks', () => {
  it('returns 5 evenly-spaced ticks, rounded to whole numbers, when maxCount is a multiple of 5', () => {
    expect(getChartTicks(10)).toEqual([10, 8, 5, 3, 0])
  })

  it('rounds the ceiling up to the next multiple of 5 when maxCount is not one', () => {
    expect(getChartTicks(12)).toEqual([15, 11, 8, 4, 0])
  })

  it('uses a minimum ceiling of 5 when maxCount is 0', () => {
    expect(getChartTicks(0)).toEqual([5, 4, 3, 1, 0])
  })
})
