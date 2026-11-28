import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { getGoogleAuthConfig } from '@/shared/utils/env'

interface AppProvidersProps {
  children: React.ReactNode
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  const googleAuth = getGoogleAuthConfig()
  const content = <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>

  return googleAuth.mode === 'ready' ? (
    <GoogleOAuthProvider clientId={googleAuth.clientId}>{content}</GoogleOAuthProvider>
  ) : content
}
