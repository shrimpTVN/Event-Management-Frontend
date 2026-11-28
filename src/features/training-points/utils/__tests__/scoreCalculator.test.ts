import { expect, it } from 'vitest'
import { capTrainingPoints } from '../scoreCalculator'
it.each([
  [15, 10, 10],
  [5, 10, 5],
  [0, 10, 0],
  [5, 0, 0],
])('caps the server total %s at %s', (total, maximum, expected) => {
  expect(capTrainingPoints(total, maximum)).toBe(expected)
})
