import { getMonthDateRange } from './month-date-range';

describe('getMonthDateRange', () => {
  it('returns the first of the month at midnight and the first of the next month as an exclusive end', () => {
    const { start, end } = getMonthDateRange(2026, 10);

    expect(start).toEqual(new Date(2026, 9, 1));
    expect(end).toEqual(new Date(2026, 10, 1));
  });

  it('rolls over to January of the next year when the month is December', () => {
    const { start, end } = getMonthDateRange(2026, 12);

    expect(start).toEqual(new Date(2026, 11, 1));
    expect(end).toEqual(new Date(2027, 0, 1));
  });
});
