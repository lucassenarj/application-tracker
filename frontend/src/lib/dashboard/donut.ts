import type { CategoryBreakdownItem } from '@/lib/dashboard/stats'

export interface DonutSegment {
  category: CategoryBreakdownItem['category']
  percentage: number
  dasharray: string
  dashoffset: number
}

const DONUT_RADIUS = 54
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS

export function computeDonutSegments(
  breakdown: CategoryBreakdownItem[],
): DonutSegment[] {
  let cumulativeLength = 0

  return breakdown.map((item) => {
    const segmentLength = (item.percentage / 100) * DONUT_CIRCUMFERENCE
    const dashoffset = -cumulativeLength
    cumulativeLength += segmentLength

    return {
      category: item.category,
      percentage: item.percentage,
      dasharray: `${segmentLength} ${DONUT_CIRCUMFERENCE}`,
      dashoffset,
    }
  })
}
