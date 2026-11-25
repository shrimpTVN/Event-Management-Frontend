import { createContext, useContext, useMemo, useRef, useState, useEffect, type ReactNode } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { MobileEventSearchHeader } from './MobileEventSearchHeader'

type SearchScope = 'local' | 'events'
export function mobileSubpageConfig(pathname: string): { title: string; search: SearchScope; placeholder: string; fallback?: string } | null {
  const path = pathname.replace(/\/+$/, '') || '/'
  const pages: Record<string, [string, string]> = {
    '/saved': ['Đã lưu', 'Tìm sự kiện đã lưu'], '/events/saved': ['Đã lưu', 'Tìm sự kiện đã lưu'],
    '/notifications': ['Thông báo', 'Tìm thông báo'], '/history': ['Lịch sử tham gia', 'Tìm trong lịch sử'],
    '/training-points': ['Điểm rèn luyện', 'Tìm tiêu chí rèn luyện'], '/drl': ['Điểm rèn luyện', 'Tìm tiêu chí rèn luyện'],
    '/sv5t': ['Sinh viên 5 tốt', 'Tìm tiêu chí sinh viên 5 tốt'], '/sinh-vien-5-tot': ['Sinh viên 5 tốt', 'Tìm tiêu chí sinh viên 5 tốt'],
  }
  if (pages[path]) return { title: pages[path][0], search: 'local', placeholder: pages[path][1] }
  if (['/events', '/events/search', '/search'].includes(path)) return { title: 'Tìm kiếm', search: 'events', placeholder: 'Tìm kiếm sự kiện, fanpage' }
  if (/^\/fanpages?(?:\/[^/]+)?$/.test(path)) return { title: 'Fanpage', search: 'local', placeholder: 'Tìm sự kiện của fanpage' }
  if (/^\/events\/[^/]+\/register$/.test(path)) return { title: 'Đăng ký tham gia', search: 'events', placeholder: 'Tìm kiếm sự kiện', fallback: path.replace(/\/register$/, '') }
  if (/^\/events\/[^/]+$/.test(path)) return { title: 'Chi tiết sự kiện', search: 'events', placeholder: 'Tìm kiếm sự kiện' }
  if (path === '/profile') return { title: 'Trang cá nhân', search: 'events', placeholder: 'Tìm kiếm sự kiện' }
  if (path === '/certificate') return { title: 'Chứng nhận tham gia', search: 'events', placeholder: 'Tìm kiếm sự kiện' }
  return null
}

interface MobilePageSearch {
  query: string
  setQuery: (query: string) => void
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}
const MobilePageContext = createContext<MobilePageSearch | null>(null)
export function MobilePageProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const [state, setState] = useState({ pathname, query: '', isOpen: false })
  const value = useMemo<MobilePageSearch>(() => ({
    query: state.pathname === pathname ? state.query : '',
    isOpen: state.pathname === pathname && state.isOpen,
    setQuery: (query) => setState((previous) => ({ pathname, query, isOpen: previous.pathname === pathname && previous.isOpen })),
    setIsOpen: (isOpen) => setState((previous) => ({ pathname, query: previous.pathname === pathname ? previous.query : '', isOpen })),
  }), [state, pathname])
  return <MobilePageContext.Provider value={value}>{children}</MobilePageContext.Provider>
}

export function useMobilePageSearch() {
  const context = useContext(MobilePageContext)
  const isPhone = useMediaQuery('(max-width: 767px)')
  return { query: isPhone ? context?.query ?? '' : '', setQuery: context?.setQuery, active: isPhone && Boolean(context) }
}

export function matchesPageSearch(query: string, ...values: unknown[]): boolean {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLocaleLowerCase('vi').trim()
  const needle = normalize(query)
  if (!needle) return true
  return normalize(values.filter((value) => typeof value === 'string').join(' ')).includes(needle)
}

export function matchesPageSearchTree(query: string, node: unknown): boolean {
  if (!query.trim()) return true
  if (!node || typeof node !== 'object') return false
  const item = node as Record<string, unknown>
  return matchesPageSearch(query, item.name, item.title, item.code, item.description) ||
    ['children', 'items'].some((key) => Array.isArray(item[key]) && item[key].some((child: unknown) => matchesPageSearchTree(query, child)))
}

export function MobileSubpageHeader() {
  const isPhone = useMediaQuery('(max-width: 767px)')
  const location = useLocation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const context = useContext(MobilePageContext)
  const config = mobileSubpageConfig(location.pathname)
  const [draft, setDraft] = useState('')
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (context?.isOpen) input.current?.focus()
  }, [context?.isOpen])
  useEffect(() => { setDraft(params.get('keyword') || params.get('search') || '') }, [location.pathname, params])
  if (!config || !context) return null
  if (isPhone && ['/events', '/events/search', '/search'].includes(location.pathname.replace(/\/+$/, ''))) return <MobileEventSearchHeader />
  const closeSearch = () => { context.setQuery(''); context.setIsOpen(false) }
  const goBack = () => {
    if (context.isOpen) { closeSearch(); return }
    // React Router's index avoids sending a direct-entry visitor outside this app.
    if (typeof window.history.state?.idx === 'number' && window.history.state.idx > 0) navigate(-1)
    else navigate(config.fallback || '/', { replace: true })
  }
  return <header className={`sticky top-0 z-50 shrink-0 ${location.pathname === '/history' ? '' : 'border-b border-border'} bg-background pt-[env(safe-area-inset-top)] md:hidden`} aria-label="Điều hướng trang">
    <div className="flex h-14 min-w-0 items-center gap-1 px-2">
      <Button type="button" variant="ghost" size="icon" className="h-11 w-11 shrink-0" onClick={goBack} aria-label={context.isOpen ? 'Đóng tìm kiếm' : 'Quay lại trang trước'}>
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      </Button>
      {context.isOpen ? <form role="search" className="flex min-w-0 flex-1 items-center gap-1" onSubmit={(event) => {
        event.preventDefault()
        if (config.search === 'events') {
          const next = ['/events', '/events/search', '/search'].includes(location.pathname) ? new URLSearchParams(params) : new URLSearchParams()
          next.delete('search')
          if (draft.trim()) next.set('keyword', draft.trim()); else next.delete('keyword')
          navigate({ pathname: '/events', search: next.toString() })
        }
        input.current?.blur()
      }}>
        <Input ref={input} type="search" value={config.search === 'local' ? context.query : draft}
          onChange={(event) => config.search === 'local' ? context.setQuery(event.target.value) : setDraft(event.target.value)}
          aria-label={config.placeholder} placeholder={config.placeholder}
          className="h-10 min-w-0 flex-1 rounded-lg bg-muted/60 text-base [&::-webkit-search-cancel-button]:appearance-none"
          onKeyDown={(event) => { if (event.key === 'Escape') closeSearch() }} />
        {(config.search === 'local' ? context.query : draft) && <Button type="button" variant="ghost" size="icon" className="h-11 w-11 shrink-0" aria-label="Xóa từ khóa" onClick={() => { context.setQuery(''); setDraft(''); input.current?.focus() }}><X className="h-5 w-5" /></Button>}
        {config.search === 'events' && <Button type="submit" variant="ghost" size="icon" className="h-11 w-11 shrink-0" aria-label="Thực hiện tìm kiếm"><Search className="h-5 w-5" /></Button>}
      </form> : <>
        <h1 className="min-w-0 flex-1 truncate px-2 font-k2d text-lg font-semibold text-foreground">{config.title}</h1>
        <Button type="button" variant="ghost" size="icon" className="h-11 w-11 shrink-0" onClick={() => context.setIsOpen(true)} aria-label={config.placeholder} aria-expanded={false}>
          <Search className="h-5 w-5" aria-hidden="true" />
        </Button>
      </>}
    </div>
  </header>
}
