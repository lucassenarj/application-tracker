import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getMonthGridDays } from '@/lib/dashboard/calendar-grid'
import { upcomingInterviewsQueryOptions } from '@/lib/dashboard/upcoming-interviews'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export function UpcomingInterviewsCalendar({
  today = new Date(),
}: { today?: Date } = {}) {
  const query = useQuery(upcomingInterviewsQueryOptions)
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const goToPreviousMonth = () => {
    setYear((y) => (month === 0 ? y - 1 : y))
    setMonth((m) => (m === 0 ? 11 : m - 1))
  }

  const goToNextMonth = () => {
    setYear((y) => (month === 11 ? y + 1 : y))
    setMonth((m) => (m === 11 ? 0 : m + 1))
  }

  const days = getMonthGridDays(year, month, today)

  const eventDateKeys = query.isSuccess
    ? new Set(
        query.data.map((interview) => toDateKey(new Date(interview.eventDate))),
      )
    : new Set<string>()

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Upcoming Interviews</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-2">
        {query.isPending && (
          <div
            className="grid flex-1 grid-cols-7 gap-1"
            style={{
              gridTemplateRows: `repeat(${days.length / 7}, minmax(0, 1fr))`,
            }}
          >
            {days.map((day) => (
              <Skeleton key={day.date.toISOString()} className="h-full w-full" />
            ))}
          </div>
        )}

        {query.isError && (
          <p className="text-sm text-destructive">
            Couldn't load your upcoming interviews. Try refreshing the page.
          </p>
        )}

        {query.isSuccess && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {MONTH_NAMES[month]} {year}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Previous month"
                  onClick={goToPreviousMonth}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Next month"
                  onClick={goToNextMonth}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {DAY_NAMES.map((name) => (
                <span
                  key={name}
                  className="text-xs font-medium text-muted-foreground"
                >
                  {name}
                </span>
              ))}
            </div>
            <div
              className="grid flex-1 grid-cols-7 gap-1 text-center"
              style={{
                gridTemplateRows: `repeat(${days.length / 7}, minmax(0, 1fr))`,
              }}
            >
              {days.map((day) => {
                const hasEvent = eventDateKeys.has(toDateKey(day.date))
                return (
                  <div
                    key={day.date.toISOString()}
                    data-slot="calendar-day"
                    data-today={day.isToday}
                    data-current-month={day.isCurrentMonth}
                    data-has-event={hasEvent}
                    className={`relative flex h-full items-center justify-center rounded-lg text-sm ${
                      day.isToday
                        ? 'bg-primary font-semibold text-primary-foreground'
                        : day.isCurrentMonth
                          ? 'text-foreground'
                          : 'text-muted-foreground/50'
                    }`}
                  >
                    {day.date.getDate()}
                    {hasEvent && (
                      <span className="absolute bottom-0.5 size-1 rounded-full bg-chart-3" />
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
