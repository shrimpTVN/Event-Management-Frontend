export function statisticsMonths(months: string[]): string[] {
  const sorted = [
    ...new Set(months.filter((month) => /^\d{4}-(0[1-9]|1[0-2])$/.test(month))),
  ].sort()
  if (!sorted.length) return []
  const index = (value: string) => Number(value.slice(0, 4)) * 12 + Number(value.slice(5)) - 1
  const first = index(sorted[0])
  const last = index(sorted[sorted.length - 1])
  return Array.from({ length: last - first + 1 }, (_, i) => {
    const value = first + i
    return `${Math.floor(value / 12)}-${String((value % 12) + 1).padStart(2, '0')}`
  })
}
