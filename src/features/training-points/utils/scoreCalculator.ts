/** Displays a server-calculated node total using that node's own cap. */
export function capTrainingPoints(totalPoint: number, maximum: number): number {
  return Math.min(maximum, totalPoint)
}
