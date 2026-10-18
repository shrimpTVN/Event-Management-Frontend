import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'

export const PageShell: React.FC = () => {
  const location = useLocation()
  const isLoginPage = location.pathname.startsWith('/login')
  const isDashboardPage = location.pathname.startsWith('/dashboard')
  const isStudentPortal = !isLoginPage && !isDashboardPage

  return (
    <div
      className={`text-foreground flex flex-col ${
        isStudentPortal
          ? 'h-screen overflow-hidden bg-[#F0F2F5] dark:bg-background'
          : 'min-h-screen bg-background'
      }`}
    >
      <Navbar />
      <main
        className={`flex-1 min-h-0 ${
          isStudentPortal
            ? 'w-full h-[calc(100vh-4rem)] overflow-hidden'
            : 'container mx-auto max-w-7xl px-4 sm:px-8 py-8'
        }`}
      >
        <Outlet />
      </main>
      {!isStudentPortal && <Footer />}
    </div>
  )
}
