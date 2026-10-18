import React from 'react'
import { Link } from 'react-router-dom'
import logoImg from '@/assets/logo.svg'

interface AuthLayoutWrapperProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  cardMaxWidth?: string
  centerText?: boolean
}

export const AuthLayoutWrapper: React.FC<AuthLayoutWrapperProps> = ({
  children,
  title,
  subtitle,
  cardMaxWidth = 'max-w-[560px]',
  centerText = false,
}) => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#F8FAFC] dark:bg-background flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* 1. Decorative Background Ellipses (Exact Figma wireframe layout: top-left, top-right, bottom-right) */}
      <div
        aria-hidden="true"
        className="absolute -top-24 -left-24 w-[360px] h-[360px] rounded-full border border-[#1B4B8A]/20 bg-[#1B4B8A]/[0.03] pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -top-20 -right-20 w-[320px] h-[320px] rounded-full border border-[#1B4B8A]/20 bg-[#1B4B8A]/[0.03] pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-24 -right-16 w-[280px] h-[280px] rounded-full border border-[#1B4B8A]/20 bg-[#1B4B8A]/[0.03] pointer-events-none"
      />

      {/* 2. Top-Left Brand Logo (Exact official logo loaded directly from src/assets/logo.png) */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-10 z-20">
        <Link to="/" className="flex items-center group transition-transform hover:opacity-90">
          <img
            src={logoImg}
            alt="CTU Event - Hệ thống quản lý sự kiện"
            className="h-10 sm:h-12 w-auto object-contain drop-shadow-xs"
          />
        </Link>
      </div>

      {/* 3. Center Form Card (Figma: form-card [560px]) */}
      <div className="relative z-10 w-full flex items-center justify-center my-auto">
        <div
          className={`w-full ${cardMaxWidth} rounded-2xl border border-[#E5E7EB] dark:border-border bg-white dark:bg-card shadow-sm p-6 sm:p-10 transition-all`}
        >
          {/* Card Header (Left-aligned as in Figma wireframe) */}
          <div className={`mb-6 ${centerText ? 'text-center' : 'text-left'}`}>
            <h1 className="font-k2d font-bold text-2xl sm:text-3xl text-[#0B1626] dark:text-foreground tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="font-sans text-sm text-[#4B5563] dark:text-muted-foreground mt-2 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {/* Form Content */}
          {children}
        </div>
      </div>
    </div>
  )
}
