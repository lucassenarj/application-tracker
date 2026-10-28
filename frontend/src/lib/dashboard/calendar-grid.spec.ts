import { getMonthGridDays, type CalendarDay } from '@/lib/dashboard/calendar-grid'

describe('getMonthGridDays', () => {
  let days: CalendarDay[]

  beforeAll(() => {
    days = getMonthGridDays(2025, 0, new Date(2025, 0, 15))
  })

  it('returns a grid from the Sunday on/before the 1st through the Saturday on/after the last day of the month', () => {
    expect(days).toHaveLength(35)
    expect(days[0].date).toEqual(new Date(2024, 11, 29))
    expect(days[days.length - 1].date).toEqual(new Date(2025, 1, 1))
  })

  it('marks days outside the requested month as isCurrentMonth: false', () => {
    expect(days[0].isCurrentMonth).toBe(false)
    expect(days[3].isCurrentMonth).toBe(true)
    expect(days[days.length - 1].isCurrentMonth).toBe(false)
  })

  it('marks exactly the day matching "today" as isToday', () => {
    const todayCount = days.filter((day) => day.isToday).length
    expect(todayCount).toBe(1)
    expect(days.find((day) => day.isToday)?.date).toEqual(new Date(2025, 0, 15))
  })
})
