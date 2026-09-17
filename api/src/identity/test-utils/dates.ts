const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

export function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * ONE_DAY_IN_MS);
}
