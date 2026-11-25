/**
 * Strips redundant `Mã tiêu chí: ...` prefixes from a criterion note and returns `null`
 * when the remaining note repeats the title or adds no rule/guidance.
 */
export function getMeaningfulCriterionNote(title: string, note?: string | null): string | null {
  if (!note) return null
  const trimmed = note.trim()
  if (!trimmed) return null

  const cleaned = trimmed
    .replace(/^mã\s*tiêu\s*chí\s*:\s*[a-zA-Z0-9.]+\s*(?:[•.\-–—]\s*|\.\s+)?/i, '')
    .trim()
  if (!cleaned) return null

  const normalize = (value: string) =>
    value.toLocaleLowerCase('vi').replace(/[\p{P}\s]+/gu, '')

  if (normalize(cleaned) === normalize(title)) return null
  return cleaned
}
