export interface StoredEvaluationData {
  completedMap: Record<number, boolean>
  noteMap: Record<number, string>
}

function getStorageKey(userKey: string | number | undefined, academicYearId: number): string {
  const resolvedUser = userKey !== undefined && userKey !== null && String(userKey).trim() ? String(userKey) : 'current'
  return `sv5t_self_eval_${resolvedUser}_${academicYearId}`
}

/**
 * Loads student's self-evaluation data from localStorage for a specific academic year
 */
export function getStoredEvaluations(
  userKey: string | number | undefined,
  academicYearId: number
): StoredEvaluationData {
  if (typeof window === 'undefined' || !academicYearId) {
    return { completedMap: {}, noteMap: {} }
  }
  try {
    const raw = localStorage.getItem(getStorageKey(userKey, academicYearId))
    if (!raw) return { completedMap: {}, noteMap: {} }
    const parsed = JSON.parse(raw)
    return {
      completedMap: parsed.completedMap || {},
      noteMap: parsed.noteMap || {},
    }
  } catch {
    return { completedMap: {}, noteMap: {} }
  }
}

/**
 * Saves student's self-evaluation data to localStorage for a specific academic year
 */
export function setStoredEvaluations(
  userKey: string | number | undefined,
  academicYearId: number,
  data: StoredEvaluationData
): void {
  if (typeof window === 'undefined' || !academicYearId) return
  try {
    localStorage.setItem(getStorageKey(userKey, academicYearId), JSON.stringify(data))
  } catch (err) {
    console.warn('Could not save self-evaluation to localStorage:', err)
  }
}
