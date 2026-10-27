export interface MonthDateRange {
  start: Date;
  end: Date;
}

export function getMonthDateRange(
  year: number,
  month: number, // 1-indexed
): MonthDateRange {
  return {
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 1),
  };
}
