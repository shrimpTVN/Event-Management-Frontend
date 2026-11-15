export type DateSortDirection = 'asc' | 'desc' | null

export function dateTimestamp(value?: string | null): number | null {
  if (!value?.trim()) return null
  const text = value.trim()
  const date = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (date) {
    const [, day, month, year] = date.map(Number)
    const time = text.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/)
    const hour = Number(time?.[1] ?? 0)
    const minute = Number(time?.[2] ?? 0)
    const second = Number(time?.[3] ?? 0)
    const utc = new Date(Date.UTC(year, month - 1, day, hour, minute, second))
    if (
      utc.getUTCFullYear() !== year ||
      utc.getUTCMonth() !== month - 1 ||
      utc.getUTCDate() !== day ||
      hour > 23 ||
      minute > 59 ||
      second > 59
    )
      return null
    return utc.getTime() - 7 * 60 * 60 * 1000
  }
  const timestamp = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T00:00:00+07:00` : text)
  return Number.isFinite(timestamp) ? timestamp : null
}

export function sortByDate<T>(
  items: readonly T[],
  direction: DateSortDirection,
  getValue: (item: T) => string | null | undefined
): T[] {
  if (!direction) return [...items]
  return items
    .map((item, index) => ({ item, index, time: dateTimestamp(getValue(item)) }))
    .sort((a, b) => {
      if (a.time == null) return b.time == null ? a.index - b.index : 1
      if (b.time == null) return -1
      const difference = direction === 'desc' ? b.time - a.time : a.time - b.time
      return difference || a.index - b.index
    })
    .map((row) => row.item)
}
