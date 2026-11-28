/**
 * Environment helpers to distinguish between real server mode and mock server mode.
 */
export const isMockMode = (): boolean => {
  return import.meta.env.MODE === 'mock'
}

export type GoogleAuthConfig =
  | { mode: 'mock' | 'unavailable'; clientId: null }
  | { mode: 'ready'; clientId: string }

export const getGoogleAuthConfig = (): GoogleAuthConfig => {
  if (isMockMode()) return { mode: 'mock', clientId: null }

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()
  if (!clientId || clientId === 'mock-client-id') {
    return { mode: 'unavailable', clientId: null }
  }

  return { mode: 'ready', clientId }
}
