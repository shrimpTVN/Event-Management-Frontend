import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Eye, Pencil } from 'lucide-react'

interface Props {
  code: string
  title: string
  note?: string
  result?: ReactNode
  group?: boolean
  recorded?: ReactNode
  evaluation?: ReactNode
  evaluated?: boolean
  onEvaluate?: () => void
  onDetail?: () => void
}

export function MobileCriterionCard({
  code,
  title,
  note,
  result,
  group,
  recorded,
  evaluation,
  evaluated,
  onEvaluate,
  onDetail,
}: Props) {
  const normalize = (value: string) => value.toLocaleLowerCase('vi').replace(/[\p{P}\s]+/gu, '')
  const showNote = note && normalize(note) !== normalize(title)

  return (
    <article
      className={`border-b border-border p-3.5 flex flex-col gap-3 ${
        group ? 'bg-muted/40' : 'bg-background'
      }`}
    >
      {/* Title & Code */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 text-sm leading-relaxed font-medium break-words text-foreground">
          <span className="text-primary font-semibold">{code}</span>
          {' · '}
          {title}
        </h3>
        {result != null && (
          <span className="shrink-0 text-sm font-semibold text-primary whitespace-nowrap tabular-nums">
            {result}
          </span>
        )}
      </div>

      {!group && (
        <>
          {/* Detailed Note Accordion */}
          {showNote && (
            <details className="text-xs leading-relaxed text-muted-foreground group/details">
              <summary className="cursor-pointer min-h-11 flex items-center text-primary font-medium select-none">
                <span>Điều kiện chi tiết</span>
              </summary>
              <p className="pb-1 text-muted-foreground leading-normal">{note}</p>
            </details>
          )}

          {/* Two balanced columns: Ghi nhận & Tự đánh giá */}
          <dl className="grid grid-cols-2 gap-3 py-2 px-3 rounded-md bg-muted/20 border border-border/60">
            <div className="flex flex-col gap-1 pr-3 border-r border-border/60">
              <dt className="text-xs text-muted-foreground font-medium">Ghi nhận</dt>
              <dd className="text-sm font-semibold text-foreground break-words">{recorded}</dd>
            </div>
            <div className="flex flex-col gap-1 pl-1">
              <dt className="text-xs text-muted-foreground font-medium">Tự đánh giá</dt>
              <dd className="text-sm font-semibold text-foreground break-words">{evaluation}</dd>
            </div>
          </dl>

          {/* Actions: Tự đánh giá (Primary) & Chi tiết (Secondary) */}
          <div className="flex items-center gap-2 pt-0.5">
            {onEvaluate && (
              <Button
                type="button"
                className="flex-1 h-11 gap-2 px-3 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs"
                onClick={onEvaluate}
              >
                <Pencil className="h-4 w-4 shrink-0" />
                <span>{evaluated ? 'Sửa đánh giá' : 'Tự đánh giá'}</span>
              </Button>
            )}
            {onDetail && (
              <Button
                type="button"
                variant="outline"
                className="h-11 gap-1.5 px-3 text-sm font-medium text-foreground hover:bg-muted border-border shrink-0"
                onClick={onDetail}
              >
                <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>Chi tiết</span>
              </Button>
            )}
          </div>
        </>
      )}
    </article>
  )
}
