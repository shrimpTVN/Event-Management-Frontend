import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import { CalendarDays, Menu, X, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StudentLeftSidebar, StudentRightSidebar } from '@/features/events'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import type { User } from '@/features/auth/types/auth.types'
import { MobileAccountMenu } from './MobileAccountMenu'
import { useScrollActivity } from '@/shared/hooks/useScrollActivity'
import './studentMobileMenu.css'

export function StudentNavigationDrawer({
  user,
  onLogout,
}: {
  user?: User | null
  onLogout?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [panel, setPanel] = useState<'navigation' | 'activity'>('navigation')
  const opener = useRef<HTMLButtonElement | null>(null)
  const location = useLocation()
  const isPhone = useMediaQuery('(max-width: 767px)')
  const onScroll = useScrollActivity(isPhone)
  const activePanel = isPhone ? 'navigation' : panel
  useEffect(() => setOpen(false), [location.pathname, location.search])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <div className="flex shrink-0 items-center 2xl:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 xl:hidden"
          aria-label="Mở menu sinh viên"
          aria-expanded={open && panel === 'navigation'}
          onClick={(event) => {
            opener.current = event.currentTarget
            setPanel('navigation')
            setOpen(true)
          }}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hidden h-11 w-11 xl:inline-flex 2xl:hidden"
          aria-label="Mở tiến độ và lịch"
          aria-expanded={open && panel === 'activity'}
          onClick={(event) => {
            opener.current = event.currentTarget
            setPanel('activity')
            setOpen(true)
          }}
        >
          <CalendarDays className="h-5 w-5" />
        </Button>
      </div>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/50" />
        <Dialog.Content
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            opener.current?.focus()
          }}
          className={`${isPhone ? 'student-mobile-drawer w-[min(20rem,calc(100vw-3rem))] pt-[max(1rem,env(safe-area-inset-top))]' : 'w-[min(22rem,calc(100vw-2rem))]'} fixed inset-y-0 left-0 z-[71] flex h-dvh flex-col gap-4 overflow-hidden border-r border-border bg-background p-4 shadow-xl pb-[max(1rem,env(safe-area-inset-bottom))]`}
        >
          <div className="flex shrink-0 items-center justify-between gap-3">
            <Dialog.Title className="font-k2d text-lg font-semibold">
              {isPhone ? 'Menu' : 'Sinh viên'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                aria-label="Đóng menu sinh viên"
              >
                <X className="h-5 w-5" />
              </Button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Tài khoản, fanpage và điều hướng các trang sinh viên.
          </Dialog.Description>
          {!isPhone && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={panel === 'navigation' ? 'secondary' : 'ghost'}
                aria-pressed={panel === 'navigation'}
                onClick={() => setPanel('navigation')}
              >
                Điều hướng
              </Button>
              <Button
                variant={panel === 'activity' ? 'secondary' : 'ghost'}
                aria-pressed={panel === 'activity'}
                onClick={() => setPanel('activity')}
              >
                Tiến độ & lịch
              </Button>
            </div>
          )}
          <div
            className="mobile-menu-scrollbar min-h-0 flex flex-1 flex-col gap-4 overflow-y-auto overscroll-contain"
            onScroll={onScroll}
            role="region"
            aria-label="Nội dung menu sinh viên"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest('a[href]')) setOpen(false)
            }}
          >
            {isPhone && user && (
              <MobileAccountMenu user={user} onCloseMenu={() => setOpen(false)} />
            )}
            {activePanel === 'navigation' ? (
              <StudentLeftSidebar showHomeLink={!isPhone} mobile={isPhone} />
            ) : (
              <StudentRightSidebar />
            )}
          </div>
          {isPhone && user && (
            <div className="shrink-0 border-t border-border pt-2">
              <Button
                variant="ghost"
                className="h-11 w-full justify-start gap-3 text-sm text-muted-foreground"
                onClick={() => {
                  setOpen(false)
                  onLogout?.()
                }}
              >
                <LogOut className="h-5 w-5" />
                Đăng xuất
              </Button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
