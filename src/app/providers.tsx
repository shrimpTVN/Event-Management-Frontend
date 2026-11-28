import React, { useEffect, useState } from 'react'
import type { AxiosError } from 'axios'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { registerQueryCacheClearer } from '@/shared/services/authRefresh'
import { getGoogleAuthConfig } from '@/shared/utils/env'

interface AppProvidersProps {
  children: React.ReactNode
}

const NON_RETRYABLE_STATUSES = new Set([400, 401, 403, 404, 422])

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: (failureCount, error) => {
              const status = (error as AxiosError | undefined)?.response?.status
              if (status && NON_RETRYABLE_STATUSES.has(status)) {
                return false
              }
              return failureCount < 1
            },
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  useEffect(() => {
    return registerQueryCacheClearer(() => queryClient.clear())
  }, [queryClient])

  const googleAuth = getGoogleAuthConfig()
  const content = <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>

  return googleAuth.mode === 'ready' ? (
    <GoogleOAuthProvider clientId={googleAuth.clientId}>{content}</GoogleOAuthProvider>
  ) : content
}
