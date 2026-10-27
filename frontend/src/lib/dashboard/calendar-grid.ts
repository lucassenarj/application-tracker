export interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function getMonthGridDays(
  year: number,
  month: number,
  today: Date,
): CalendarDay[] {
  const firstOfMonth = new Date(year, month, 1)
  const lastOfMonth = new Date(year, month + 1, 0)

  const start = new Date(year, month, 1 - firstOfMonth.getDay())
  const end = new Date(
    lastOfMonth.getFullYear(),
    lastOfMonth.getMonth(),
    lastOfMonth.getDate() + (6 - lastOfMonth.getDay()),
  )

  const days: CalendarDay[] = []
  for (
    let date = new Date(start);
    date <= end;
    date = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
  ) {
    days.push({
      date,
      isCurrentMonth: date.getMonth() === month,
      isToday: isSameDay(date, today),
    })
  }

  return days
}
