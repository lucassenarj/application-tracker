export function getChartTicks(maxCount: number): number[] {
  const ceiling = Math.max(5, Math.ceil(maxCount / 5) * 5)
  return [1, 0.75, 0.5, 0.25, 0].map((fraction) => Math.round(ceiling * fraction))
}
