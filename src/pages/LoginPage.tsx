import React from 'react'
import { LoginForm } from '@/features/auth'

export const LoginPage: React.FC = () => {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <LoginForm />
    </div>
  )
}
