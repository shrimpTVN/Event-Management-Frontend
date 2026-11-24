import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('student-theme')
      if (saved) return saved === 'dark'
    } catch {
      /* Storage may be unavailable in private browsing. */
    }
    return document.documentElement.classList.contains('dark')
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
    try {
      localStorage.setItem('student-theme', dark ? 'dark' : 'light')
    } catch {
      /* Keep toggling without storage. */
    }
  }, [dark])

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-11 w-11 text-muted-foreground"
      aria-label={dark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
      onClick={() => setDark((value) => !value)}
    >
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  )
}
