import React from 'react'
import { Link } from 'react-router-dom'
import logoImg from '@/assets/logo.svg'
import { ParticleBackground } from '@/components/common/ParticleBackground'

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
    <div
      className="auth-layout notranslate relative min-h-screen w-full overflow-hidden bg-[#F8FAFC] dark:bg-background flex items-center justify-center p-4 sm:p-6 lg:p-8 select-none"
      translate="no"
    >
      {/* 0. Ambient Aurora Mesh Glow (Đồng bộ chuẩn hệ màu Brand Blue, Sky & Cyan của hệ thống) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        <div className="absolute -top-[15%] -left-[10%] w-[550px] h-[550px] rounded-full bg-gradient-to-br from-blue-500/15 via-sky-300/12 to-transparent blur-3xl" />
        <div className="absolute -bottom-[15%] -right-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-blue-600/15 via-cyan-400/12 to-transparent blur-3xl" />
        <div className="absolute top-1/4 -right-[10%] w-[420px] h-[420px] rounded-full bg-gradient-to-l from-sky-400/10 via-blue-200/10 to-transparent blur-3xl" />
        <div className="absolute -bottom-[10%] left-1/4 w-[480px] h-[480px] rounded-full bg-gradient-to-tr from-cyan-400/10 via-sky-100/10 to-transparent blur-3xl" />
      </div>

      {/* 0.1 Interactive Particle Background (Hình thoi kim cương chuẩn nhận diện logo CTU) */}
      <ParticleBackground />

      {/* 1. Top-Left Brand Logo (Exact official logo loaded directly from src/assets/logo.png) */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-10 z-20">
        <Link to="/" className="flex items-center group transition-transform hover:opacity-90">
          <img
            src={logoImg}
            alt="CTU Event - Hệ thống quản lý sự kiện"
            className="h-10 sm:h-12 w-auto object-contain drop-shadow-xs"
          />
        </Link>
      </div>

      {/* 2. Center Form Card (Figma: form-card [560px] with elegant backdrop glass effect) */}
      <div className="relative z-10 w-full flex items-center justify-center my-auto">
        <div
          className={`w-full ${cardMaxWidth} rounded-2xl border border-slate-200/90 dark:border-border/90 bg-white/95 dark:bg-card/95 backdrop-blur-md shadow-xl p-6 sm:p-10 transition-all`}
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
