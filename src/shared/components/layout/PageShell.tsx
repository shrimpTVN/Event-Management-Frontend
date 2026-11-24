import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { MobilePageProvider, MobileSubpageHeader, mobileSubpageConfig } from './MobileSubpageHeader'
import '@/shared/styles/studentResponsive.css'

export const PageShell: React.FC = () => {
  const location = useLocation()
  const isLoginPage = location.pathname.startsWith('/login')
  const isDashboardPage = location.pathname.startsWith('/dashboard')
  const isStudentPortal = !isLoginPage && !isDashboardPage
  const isSubpage = Boolean(mobileSubpageConfig(location.pathname))

  return (
    <MobilePageProvider><div
      data-mobile-subpage={isSubpage || undefined}
      className={`text-foreground flex flex-col ${
        isStudentPortal
          ? 'student-portal h-dvh min-h-0 overflow-hidden bg-muted/40 dark:bg-background'
          : 'min-h-screen bg-background'
      }`}
    >
      <MobileSubpageHeader />
      <Navbar mobileSubpage={isSubpage} />
      <main
        className={`flex-1 min-h-0 ${
          isStudentPortal
            ? 'w-full min-w-0 overflow-hidden'
            : 'container mx-auto max-w-7xl px-4 sm:px-8 py-8'
        }`}
      >
        <Outlet />
      </main>
      {!isStudentPortal && <Footer />}
    </div></MobilePageProvider>
  )
}
