import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { getMonthGridDays } from '@/lib/dashboard/calendar-grid'
import { interviewsByMonthQueryOptions } from '@/lib/dashboard/interviews-by-month'
import type { UpcomingInterview } from '@/lib/dashboard/upcoming-interviews'

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

function formatInterviewTime(eventDate: string): string {
  return new Date(eventDate).toLocaleString(navigator.language, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function UpcomingInterviewsCalendar({
  today = new Date(),
}: { today?: Date } = {}) {
  const navigate = useNavigate()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const query = useQuery(interviewsByMonthQueryOptions(year, month + 1))

  const goToDetail = (id: string) => {
    navigate({ to: '/applications/$id', params: { id } })
  }

  const goToPreviousMonth = () => {
    setYear((y) => (month === 0 ? y - 1 : y))
    setMonth((m) => (m === 0 ? 11 : m - 1))
  }

  const goToNextMonth = () => {
    setYear((y) => (month === 11 ? y + 1 : y))
    setMonth((m) => (m === 11 ? 0 : m + 1))
  }

  const days = getMonthGridDays(year, month, today)

  const eventsByDateKey = new Map<string, UpcomingInterview[]>()
  if (query.isSuccess) {
    for (const interview of query.data) {
      const key = toDateKey(new Date(interview.eventDate))
      eventsByDateKey.set(key, [...(eventsByDateKey.get(key) ?? []), interview])
    }
  }

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
                const dayEvents = eventsByDateKey.get(toDateKey(day.date)) ?? []
                const hasEvent = dayEvents.length > 0
                const cell = (
                  <div
                    key={day.date.toISOString()}
                    data-slot="calendar-day"
                    data-today={day.isToday}
                    data-current-month={day.isCurrentMonth}
                    data-has-event={hasEvent}
                    className={`relative flex h-full items-center justify-center rounded-lg text-sm ${
                      hasEvent ? 'cursor-pointer' : ''
                    } ${
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

                if (!hasEvent) {
                  return cell
                }

                return (
                  <Popover key={day.date.toISOString()}>
                    <PopoverTrigger render={cell} />
                    <PopoverContent>
                      <div className="flex flex-col gap-2">
                        {dayEvents.map((interview) => (
                          <div
                            key={interview.statusChangeId}
                            className="cursor-pointer rounded-md p-1.5 hover:bg-muted"
                            onClick={() => goToDetail(interview.applicationId)}
                          >
                            <p className="font-medium text-foreground">
                              {interview.applicationTitle}
                            </p>
                            <p className="text-muted-foreground">
                              {interview.companyName}
                            </p>
                            <span className="text-xs text-muted-foreground/70">
                              {formatInterviewTime(interview.eventDate)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
