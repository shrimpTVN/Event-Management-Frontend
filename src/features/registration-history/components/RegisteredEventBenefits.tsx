import { Tooltip } from '@/components/ui/tooltip'
import * as Dialog from '@radix-ui/react-dialog'
import { Award, Star, Gift, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { RegisteredEventItem } from '../types/history.types'

export function RegisteredEventBenefits({ event }: { event: RegisteredEventItem }) {
  const benefits = (
    event.benefits?.length ? event.benefits : [event.pointsCategory, event.criteriaSv5t]
  )
    .filter((benefit): benefit is string => typeof benefit === 'string' && Boolean(benefit.trim()))
    .map((text, index) => {
      const isSv5t = /SV\s*5\s*T|sinh viên 5 tốt/i.test(text) || text === event.criteriaSv5t
      const isPoint =
        !isSv5t &&
        (/ĐRL|DRL|điểm rèn luyện|\+\s*\d+\s*(?:điểm|đ)/i.test(text) ||
          text === event.pointsCategory)
      return {
        type: isSv5t ? 'sv5t' : isPoint ? 'point' : 'other',
        detail: event.benefitDetails?.[index]?.replace(/ĐRL|DRL/gi, 'điểm'),
        text: text
          .replace(/ĐRL|DRL/gi, 'điểm')
          .replace(/^(?:Tiêu chuẩn|Tiêu chí)?\s*(?:SV\s*5\s*T|sinh viên 5 tốt)\s*:\s*/i, '')
          .trim(),
      }
    })
  const groups = [
    { type: 'point', title: 'Điểm rèn luyện', icon: Award },
    { type: 'sv5t', title: 'Sinh viên 5 tốt', icon: Star },
    { type: 'other', title: 'Quyền lợi khác', icon: Gift },
  ]
    .map((group) => ({
      ...group,
      items: benefits.filter((benefit) => benefit.type === group.type),
    }))
    .filter((group) => group.items.length > 0)
  const orderedBenefits = groups.flatMap((group) => group.items)
  const firstBenefit = orderedBenefits[0]?.text
  const extraCount = benefits.length - 1

  if (!benefits.length) {
    return <span className="text-xs text-muted-foreground">Theo thông báo BTC</span>
  }

  return (
    <div className="flex min-w-0 items-center gap-1.5" onClick={(event) => event.stopPropagation()}>
      <Dialog.Root>
        <Dialog.Trigger asChild>
          <Tooltip content={firstBenefit}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto min-w-0 max-w-full bg-brand-subtle px-2 py-1 text-xs font-medium text-brand-subtle-foreground hover:bg-brand-subtle/80 hover:text-brand-subtle-foreground"
              aria-label={`Xem quyền lợi: ${firstBenefit}`}
            >
              <span className="truncate">{firstBenefit}</span>
            </Button>
          </Tooltip>
        </Dialog.Trigger>
        {extraCount > 0 && (
          <Dialog.Trigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-auto shrink-0 border-border bg-transparent px-2 py-1 text-xs font-medium text-muted-foreground shadow-none hover:bg-muted hover:text-foreground"
              aria-label={`Xem ${extraCount} quyền lợi khác`}
            >
              +{extraCount}
            </Button>
          </Dialog.Trigger>
        )}
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-xl">
            <div className="flex shrink-0 flex-col gap-2 border-b border-border p-5 pr-14">
              <Dialog.Title className="font-k2d text-lg font-semibold">
                Quyền lợi tham gia
              </Dialog.Title>
              <Dialog.Description className="break-words text-sm text-muted-foreground">
                {event.title || event.eventName || 'Sự kiện'}
              </Dialog.Description>
              <Dialog.Close asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-3 top-3"
                  aria-label="Đóng quyền lợi"
                >
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            </div>
            <div className="flex min-h-0 flex-col gap-5 overflow-y-auto p-5">
              {groups.map((group, index) => {
                const Icon = group.icon
                return (
                  <section
                    key={group.type}
                    className={
                      index > 0
                        ? 'flex flex-col gap-3 border-t border-border pt-5'
                        : 'flex flex-col gap-3'
                    }
                  >
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {group.title}
                    </h3>
                    <ul className="flex flex-col gap-2">
                      {group.items.map((benefit, itemIndex) => (
                        <li
                          key={itemIndex}
                          className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground"
                        >
                          {benefit.type === 'sv5t' && benefit.text === event.criteriaSv5t
                            ? event.criteriaSv5tDetail || benefit.text
                            : benefit.detail || benefit.text}
                        </li>
                      ))}
                    </ul>
                  </section>
                )
              })}
            </div>
            <div className="flex shrink-0 justify-end border-t border-border p-4">
              <Dialog.Close asChild>
                <Button type="button" variant="outline">
                  Đóng
                </Button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
