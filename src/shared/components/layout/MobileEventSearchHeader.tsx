import { useRef } from 'react'
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NavbarSearchAutocomplete } from '@/features/events/components/NavbarSearchAutocomplete'

export function MobileEventSearchHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const navigationType = useNavigationType()
  const focus = useRef(navigationType !== 'POP' && Boolean(location.state?.focusSearch))
  return (
    <header
      aria-label="Tìm kiếm sự kiện và fanpage"
      className="sticky top-0 z-50 shrink-0 border-b border-border bg-background pt-[env(safe-area-inset-top)] md:hidden"
    >
      <div className="flex h-14 min-w-0 items-center gap-1 px-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-11 w-11 shrink-0"
          aria-label="Quay lại trang trước"
          onClick={() => {
            if (typeof window.history.state?.idx === 'number' && window.history.state.idx > 0)
              navigate(-1)
            else navigate('/', { replace: true })
          }}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <NavbarSearchAutocomplete mobile autoFocus={focus.current} />
      </div>
    </header>
  )
}
