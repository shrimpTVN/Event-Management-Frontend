import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import { ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { User } from '@/features/auth/types/auth.types'
import { AccountNavigationPopup } from './AccountNavigationPopup'
import { useScrollActivity } from '@/shared/hooks/useScrollActivity'
import './studentMobileMenu.css'

export function MobileAccountMenu({ user, onCloseMenu }: { user: User; onCloseMenu: () => void }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const onScroll = useScrollActivity()
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <div className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-card p-2">
        <Button
          variant="ghost"
          aria-label={`Xem hồ sơ ${user.name}`}
          className="h-auto min-h-14 min-w-0 flex-1 justify-start gap-3 whitespace-normal p-2 text-left"
          onClick={() => {
            onCloseMenu()
            navigate('/profile')
          }}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              user.name?.charAt(0).toUpperCase()
            )}
          </span>
          <span className="min-w-0 break-words text-sm font-semibold">{user.name}</span>
        </Button>
        <Dialog.Trigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-lg bg-muted/80 text-foreground hover:bg-muted"
            aria-label="Chuyển tài khoản hoặc fanpage"
          >
            <ChevronDown className="h-5 w-5" />
          </Button>
        </Dialog.Trigger>
      </div>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="student-mobile-account-sheet fixed inset-x-0 bottom-0 z-[81] flex max-h-[85dvh] flex-col gap-3 overflow-hidden rounded-t-xl border-t border-border bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-foreground shadow-xl data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-4">
          <span
            aria-hidden="true"
            className="mx-auto h-1 w-10 shrink-0 rounded-full bg-muted-foreground/40"
          />
          <div className="flex shrink-0 items-center justify-between gap-3">
            <Dialog.Title className="font-k2d text-lg font-semibold">
              Tài khoản và fanpage
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                aria-label="Đóng bảng chuyển tài khoản"
              >
                <X className="h-5 w-5" />
              </Button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Chọn tài khoản cá nhân hoặc một fanpage bạn đang quản lý.
          </Dialog.Description>
          <div
            className="mobile-menu-scrollbar min-h-0 overflow-y-auto overscroll-contain"
            onScroll={onScroll}
          >
            <AccountNavigationPopup
              isOpen
              embedded
              accountPicker
              user={user}
              onClose={() => setOpen(false)}
              onLogout={() => {}}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
