export interface ApplicationsOverTimeBucket {
  weekStart: string;
  count: number;
}

function startOfWeek(date: Date): Date {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const day = start.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day;
  start.setUTCDate(start.getUTCDate() + diff);
  return start;
}

export function bucketApplicationsByWeek(
  createdDates: Date[],
  weekCount: number,
  now: Date = new Date(),
): ApplicationsOverTimeBucket[] {
  const currentWeekStart = startOfWeek(now);

  const buckets: ApplicationsOverTimeBucket[] = [];
  for (let i = weekCount - 1; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setUTCDate(weekStart.getUTCDate() - i * 7);
    buckets.push({ weekStart: weekStart.toISOString().slice(0, 10), count: 0 });
  }

  for (const date of createdDates) {
    const weekStart = startOfWeek(date).toISOString().slice(0, 10);
    const bucket = buckets.find((b) => b.weekStart === weekStart);
    if (bucket) {
      bucket.count += 1;
    }
  }

  return buckets;
}
