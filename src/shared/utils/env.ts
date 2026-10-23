/**
 * Environment helpers to distinguish between real server mode and mock server mode.
 */
export const isMockMode = (): boolean => {
  return import.meta.env.MODE === 'mock'
}
