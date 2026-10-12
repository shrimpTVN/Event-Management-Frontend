import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'

export const PageShell: React.FC = () => {
  const location = useLocation()
  const isHomePage = location.pathname === '/'

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main
        className={`flex-1 ${
          isHomePage
            ? 'w-full max-w-[1440px] mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6'
            : 'container mx-auto max-w-7xl px-4 sm:px-8 py-8'
        }`}
      >
        <Outlet />
      </main>
      {!isHomePage && <Footer />}
    </div>
  )
}
