import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { Calendar } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import type { User } from '../types/auth.types'

export const LoginForm: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setAuth } = useAuthStore()

  const redirectUrl = searchParams.get('redirect') || '/'

  const handleGoogleSuccess = (credentialResponse: any) => {
    const mockUser: User = {
      id: 'usr-google-1',
      name: 'Demo Attendee',
      email: 'attendee@eventhub.io',
      role: 'ATTENDEE',
      createdAt: new Date().toISOString(),
    }
    setAuth(mockUser, credentialResponse.credential || 'mock-google-jwt-token')
    navigate(redirectUrl, { replace: true })
  }

  const handleDemoOrganizerLogin = () => {
    const mockOrganizer: User = {
      id: 'usr-organizer-1',
      name: 'Lead Organizer',
      email: 'organizer@eventhub.io',
      role: 'ORGANIZER',
      createdAt: new Date().toISOString(),
    }
    setAuth(mockOrganizer, 'mock-organizer-jwt-token')
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm space-y-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Calendar className="h-6 w-6" />
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sign In to EventHub</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Sign in with Google to register for events and manage certificates.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 pt-2">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => console.error('Login Failed')}
          useOneTap={false}
        />

        <div className="relative w-full my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Demo shortcuts</span>
          </div>
        </div>

        <button
          onClick={handleDemoOrganizerLogin}
          className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
        >
          Sign in as Organizer (Demo)
        </button>
      </div>
    </div>
  )
}
