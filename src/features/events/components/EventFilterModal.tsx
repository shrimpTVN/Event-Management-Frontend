import React, { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  Search as SearchIcon,
  SlidersHorizontal,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import {
  eventFilterOptionsService,
  type EventFilterOptions,
} from '../services/eventFilterOptionsService'
import {
  eventService,
  isEventMatchingRegistrationStatus,
  resolveAllowedPointCategoryIds,
} from '../services/eventService'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { apiClient } from '@/shared'
import { useAuthStore } from '@/features/auth'

export interface EventFilterFormValues {
  academicYear?: string
  semesterId?: string
  eventTypeId?: string
  fanpageId?: string
  fanpageIds?: string[]
  criteriaId?: string
  pointCategoryId?: string
  status?: string
  dateHappenFrom?: string
  dateHappenTo?: string
  childCategoryIds?: string[]
  childCriteriaIds?: string[]
}

interface EventFilterModalProps {
  isOpen: boolean
  onClose: () => void
  initialValues?: EventFilterFormValues
  onApply: (values: EventFilterFormValues) => void
  events?: any[]
  hideFanpageFilter?: boolean
}

// Preset trạng thái sự kiện (không có chip "Tất cả" - mặc định để trống là tất cả)
const STATUS_CHIPS = [
  { key: 'OPEN_REGISTRATION', label: 'Đang mở đăng ký' },
  { key: 'PUBLISHED', label: 'Sắp diễn ra' },
  { key: 'COMPLETED', label: 'Đã kết thúc' },
]

export const EventFilterModal: React.FC<EventFilterModalProps> = ({
  isOpen,
  onClose,
  initialValues = {},
  onApply,
  events,
  hideFanpageFilter = false,
}) => {
  const { isAuthenticated } = useAuthStore()
  const [formValues, setFormValues] = useState<EventFilterFormValues>(initialValues)
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(
    initialValues.academicYear || 'ALL'
  )
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [timePreset, setTimePreset] = useState<'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM' | null>(null)

  // Multi-select for Fanpages
  const [selectedFanpageIds, setSelectedFanpageIds] = useState<string[]>(() => {
    if (initialValues.fanpageIds && initialValues.fanpageIds.length > 0) {
      return initialValues.fanpageIds
    }
    return initialValues.fanpageId ? [String(initialValues.fanpageId)] : []
  })

  // Combobox open states for Searchable inputs
  const [openCombobox, setOpenCombobox] = useState<'fanpage' | 'eventType' | null>(null)
  const [fanpageSearch, setFanpageSearch] = useState('')
  const [eventTypeSearch, setEventTypeSearch] = useState('')

  const modalRef = useRef<HTMLDivElement>(null)
  const advancedRef = useRef<HTMLDivElement>(null)

  const { data: options } = useQuery<EventFilterOptions>({
    queryKey: ['event-filter-options'],
    queryFn: () => eventFilterOptionsService.getFilterOptions(),
    staleTime: 5 * 60 * 1000,
    enabled: isOpen,
  })

  // Lấy danh sách fanpage đang theo dõi (để ưu tiên hiển thị ở nhóm Đang theo dõi)
  const { data: followedFanpages = [] } = useQuery<any[]>({
    queryKey: ['fanpages', 'following', isAuthenticated],
    queryFn: async () => {
      if (!isAuthenticated) return []
      try {
        const res: any = await apiClient.get('/fanpages/following', { params: { size: 50 } })
        return res?.content || res?.data || (Array.isArray(res) ? res : [])
      } catch {
        return []
      }
    },
    staleTime: 5 * 60 * 1000,
    enabled: isOpen && isAuthenticated,
  })

  // Dữ liệu sự kiện dùng để tính toán đếm số lượng kết quả xem trước
  const { data: fallbackEvents = [] } = useQuery<any[]>({
    queryKey: ['events', 'filter-modal-preview'],
    queryFn: () => eventService.getEvents({ size: 100 }),
    staleTime: 60 * 1000,
    enabled: isOpen && (!events || events.length === 0),
  })

  const previewSourceEvents = events && events.length > 0 ? events : fallbackEvents

  // Đồng bộ khi mở modal
  useEffect(() => {
    if (isOpen) {
      setFormValues(initialValues)
      setOpenCombobox(null)
      setFanpageSearch('')
      setEventTypeSearch('')

      if (initialValues.fanpageIds && initialValues.fanpageIds.length > 0) {
        setSelectedFanpageIds(initialValues.fanpageIds)
      } else if (initialValues.fanpageId) {
        setSelectedFanpageIds([String(initialValues.fanpageId)])
      } else {
        setSelectedFanpageIds([])
      }

      if (initialValues.academicYear) {
        setSelectedAcademicYear(initialValues.academicYear)
      } else if (initialValues.semesterId && options?.semesters) {
        const matchingSem = options.semesters.find((s) => String(s.id) === String(initialValues.semesterId))
        setSelectedAcademicYear(matchingSem?.academicYear || 'ALL')
      } else {
        setSelectedAcademicYear('ALL')
      }

      // Tự động mở mục nâng cao nếu người dùng đã có lọc năm học, học kỳ hoặc fanpage
      if (
        initialValues.academicYear ||
        initialValues.semesterId ||
        initialValues.fanpageId ||
        (initialValues.fanpageIds && initialValues.fanpageIds.length > 0)
      ) {
        setIsAdvancedOpen(true)
      }

      // Xác định time preset
      if (!initialValues.dateHappenFrom && !initialValues.dateHappenTo) {
        setTimePreset(null)
      } else {
        const today = new Date()
        const todayStr = format(today, 'yyyy-MM-dd')
        const weekStartStr = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
        const weekEndStr = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
        const monthStartStr = format(startOfMonth(today), 'yyyy-MM-dd')
        const monthEndStr = format(endOfMonth(today), 'yyyy-MM-dd')

        if (initialValues.dateHappenFrom === todayStr && initialValues.dateHappenTo === todayStr) {
          setTimePreset('TODAY')
        } else if (initialValues.dateHappenFrom === weekStartStr && initialValues.dateHappenTo === weekEndStr) {
          setTimePreset('THIS_WEEK')
        } else if (initialValues.dateHappenFrom === monthStartStr && initialValues.dateHappenTo === monthEndStr) {
          setTimePreset('THIS_MONTH')
        } else {
          setTimePreset('CUSTOM')
        }
      }
    }
  }, [isOpen, initialValues, options?.semesters])

  // Đóng combobox khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setOpenCombobox(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Phím Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (openCombobox) {
          setOpenCombobox(null)
        } else {
          onClose()
        }
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, openCombobox, onClose])

  // Học kỳ lọc theo năm học
  const availableSemesters = useMemo(() => {
    if (!options?.semesters) return []
    if (!selectedAcademicYear || selectedAcademicYear === 'ALL') {
      return options.semesters
    }
    return options.semesters.filter(
      (s) => !s.academicYear || s.academicYear === selectedAcademicYear
    )
  }, [options?.semesters, selectedAcademicYear])

  // Xử lý chọn Preset thời gian (Hỗ trợ click lại để hủy chọn)
  const handleSelectTimePreset = (preset: 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM') => {
    if (timePreset === preset) {
      // Bỏ chọn preset -> Quay lại không giới hạn thời gian (Tất cả)
      setTimePreset(null)
      setFormValues((prev) => ({ ...prev, dateHappenFrom: undefined, dateHappenTo: undefined }))
      return
    }

    setTimePreset(preset)
    const today = new Date()
    if (preset === 'TODAY') {
      const todayStr = format(today, 'yyyy-MM-dd')
      setFormValues((prev) => ({ ...prev, dateHappenFrom: todayStr, dateHappenTo: todayStr }))
    } else if (preset === 'THIS_WEEK') {
      const weekStartStr = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      const weekEndStr = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      setFormValues((prev) => ({ ...prev, dateHappenFrom: weekStartStr, dateHappenTo: weekEndStr }))
    } else if (preset === 'THIS_MONTH') {
      const monthStartStr = format(startOfMonth(today), 'yyyy-MM-dd')
      const monthEndStr = format(endOfMonth(today), 'yyyy-MM-dd')
      setFormValues((prev) => ({ ...prev, dateHappenFrom: monthStartStr, dateHappenTo: monthEndStr }))
    }
  }

  // Toggle Chip Trạng thái (Hỗ trợ multi-select)
  const selectedStatuses = useMemo(() => {
    return formValues.status ? formValues.status.split(',').filter(Boolean) : []
  }, [formValues.status])

  const handleToggleStatus = (statusKey: string) => {
    let next: string[]
    if (selectedStatuses.includes(statusKey)) {
      next = selectedStatuses.filter((s) => s !== statusKey)
    } else {
      next = [...selectedStatuses, statusKey]
    }
    setFormValues((prev) => ({
      ...prev,
      status: next.length > 0 ? next.join(',') : undefined,
    }))
  }

  // Toggle Chip Loại hình (Hỗ trợ multi-select)
  const selectedTypeIds = useMemo(() => {
    return formValues.eventTypeId ? formValues.eventTypeId.split(',').filter(Boolean) : []
  }, [formValues.eventTypeId])

  const handleToggleType = (typeId: string) => {
    let next: string[]
    if (selectedTypeIds.includes(typeId)) {
      next = selectedTypeIds.filter((t) => t !== typeId)
    } else {
      next = [...selectedTypeIds, typeId]
    }
    setFormValues((prev) => ({
      ...prev,
      eventTypeId: next.length > 0 ? next.join(',') : undefined,
    }))
  }

  const handleClearTypes = () => {
    setFormValues((prev) => ({ ...prev, eventTypeId: undefined }))
  }

  const eventTypeSearchLower = eventTypeSearch.trim().toLowerCase()
  const filteredEventTypes = useMemo(() => {
    if (!options?.eventTypes) return []
    if (!eventTypeSearchLower) return options.eventTypes
    return options.eventTypes.filter((et) => et.label.toLowerCase().includes(eventTypeSearchLower))
  }, [options?.eventTypes, eventTypeSearchLower])

  // Tách Point Categories thành 5 Mục lớn (Level 0) và Mục con (Level 1)
  const rootPointCategories = useMemo(() => {
    if (!options?.pointCategories) return []
    const roots = options.pointCategories.filter((pc) => pc.level === 0 || !pc.parentCategoryId)
    return roots.length > 0 ? roots : options.pointCategories.slice(0, 5)
  }, [options?.pointCategories])

  const childPointCategories = useMemo(() => {
    if (!options?.pointCategories) return []
    return options.pointCategories.filter((pc) => pc.level === 1 || Boolean(pc.parentCategoryId))
  }, [options?.pointCategories])

  // Toggle Chip Mục ĐRL (Hỗ trợ multi-select)
  const selectedPointCategoryIds = useMemo(() => {
    return formValues.pointCategoryId ? formValues.pointCategoryId.split(',').filter(Boolean) : []
  }, [formValues.pointCategoryId])

  const handleTogglePointCategory = (catId: string) => {
    const isRoot = rootPointCategories.some((r) => String(r.id) === catId)

    setFormValues((prev) => {
      const currentList = prev.pointCategoryId ? prev.pointCategoryId.split(',').filter(Boolean) : []

      if (isRoot) {
        // Toggle root: if root or any of its children are selected, clear all of them
        const childIdsOfRoot = childPointCategories
          .filter((cpc) => String(cpc.parentCategoryId) === catId)
          .map((cpc) => String(cpc.id))
        const isAnySelected = currentList.includes(catId) || childIdsOfRoot.some((cid) => currentList.includes(cid))

        let next: string[]
        if (isAnySelected) {
          next = currentList.filter((id) => id !== catId && !childIdsOfRoot.includes(id))
        } else {
          next = [...currentList, catId]
        }
        return {
          ...prev,
          pointCategoryId: next.length > 0 ? next.join(',') : undefined,
        }
      } else {
        // Child category toggled (e.g. IV.a)
        const childObj = childPointCategories.find((cpc) => String(cpc.id) === catId)
        const parentId = childObj?.parentCategoryId ? String(childObj.parentCategoryId) : null

        let next: string[]
        if (currentList.includes(catId)) {
          // Unselect child
          next = currentList.filter((id) => id !== catId)
        } else {
          // Select child: add child ID; also keep parentId so child row stays open
          next = parentId && !currentList.includes(parentId)
            ? [...currentList, parentId, catId]
            : [...currentList, catId]
        }
        return {
          ...prev,
          pointCategoryId: next.length > 0 ? next.join(',') : undefined,
        }
      }
    })
  }

  // Toggle Chip Tiêu chuẩn SV5T (Hỗ trợ multi-select)
  const selectedCriteriaIds = useMemo(() => {
    return formValues.criteriaId ? formValues.criteriaId.split(',').filter(Boolean) : []
  }, [formValues.criteriaId])

  const handleToggleCriteria = (critId: string) => {
    let next: string[]
    if (selectedCriteriaIds.includes(critId)) {
      next = selectedCriteriaIds.filter((id) => id !== critId)
    } else {
      next = [...selectedCriteriaIds, critId]
    }
    setFormValues((prev) => ({
      ...prev,
      criteriaId: next.length > 0 ? next.join(',') : undefined,
    }))
  }

  // Toggle Fanpage (Hỗ trợ multi-select)
  const handleToggleFanpage = (fpId: string) => {
    setSelectedFanpageIds((prev) =>
      prev.includes(fpId) ? prev.filter((id) => id !== fpId) : [...prev, fpId]
    )
  }

  const handleClearFanpages = () => {
    setSelectedFanpageIds([])
  }

  // Toggle Accordion Nâng cao & Cuộn mượt xuống khi mở
  const handleToggleAdvanced = () => {
    setIsAdvancedOpen((prev) => {
      const next = !prev
      if (next) {
        setTimeout(() => {
          advancedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }, 50)
      }
      return next
    })
  }

  // Reset toàn bộ bộ lọc
  const handleReset = () => {
    setFormValues({})
    setSelectedAcademicYear('ALL')
    setSelectedFanpageIds([])
    setTimePreset(null)
    setFanpageSearch('')
    setEventTypeSearch('')
    setOpenCombobox(null)
  }

  // Áp dụng bộ lọc
  const handleApply = () => {
    const selectedCriteria = options?.criterias.find((c) => String(c.id) === String(formValues.criteriaId))
    const selectedPointCategory = options?.pointCategories.find(
      (pc) => String(pc.id) === String(formValues.pointCategoryId)
    )

    const finalValues: EventFilterFormValues = {
      ...formValues,
      fanpageId: selectedFanpageIds[0] || undefined,
      fanpageIds: selectedFanpageIds.length > 0 ? selectedFanpageIds : undefined,
      academicYear: selectedAcademicYear !== 'ALL' ? selectedAcademicYear : undefined,
      childCriteriaIds: selectedCriteria?.childIds ? selectedCriteria.childIds.map(String) : undefined,
      childCategoryIds: selectedPointCategory?.childIds
        ? selectedPointCategory.childIds.map(String)
        : undefined,
    }

    onApply(finalValues)
    onClose()
  }

  // Tính số lượng sự kiện khớp theo thời gian thực (Live Preview Count)
  const previewMatchingCount = useMemo(() => {
    if (!previewSourceEvents || previewSourceEvents.length === 0) return 0
    const now = new Date()

    // 1. Resolve allowed point category IDs respecting parent/child hierarchy
    const allowedPointCatIds = resolveAllowedPointCategoryIds(
      selectedPointCategoryIds,
      options?.pointCategories
    )

    // 2. Resolve academic year matching semester IDs
    const matchingYearSemesterIds = new Set<string>()
    if (selectedAcademicYear && selectedAcademicYear !== 'ALL' && options?.semesters) {
      options.semesters.forEach((s) => {
        const cleanSemYear = (s.academicYear || '').replace(/\s+/g, '')
        const cleanTargetYear = selectedAcademicYear.replace(/\s+/g, '')
        if (cleanSemYear && cleanSemYear === cleanTargetYear) {
          matchingYearSemesterIds.add(String(s.id))
        }
      })
    }

    return previewSourceEvents.filter((evt: any) => {
      // 1. Trạng thái sự kiện (Đang mở đăng ký, Sắp diễn ra, Đã kết thúc)
      if (selectedStatuses.length > 0) {
        const matches = selectedStatuses.some((st) => isEventMatchingRegistrationStatus(evt, st, now))
        if (!matches) return false
      }

      // 2. Loại hình sự kiện (Combobox multi-select)
      if (selectedTypeIds.length > 0) {
        const evtTypeId = String(evt.eventTypeId ?? evt.categoryId ?? '')
        if (!selectedTypeIds.includes(evtTypeId)) return false
      }

      // 3. Quyền lợi ĐRL
      if (selectedPointCategoryIds.length > 0) {
        if (allowedPointCatIds.size > 0) {
          let hasMatch = false
          if (Array.isArray(evt.eventPoints) && evt.eventPoints.length > 0) {
            hasMatch = evt.eventPoints.some((ep: any) =>
              allowedPointCatIds.has(Number(ep.pointCategoryId || ep.id))
            )
          } else if (evt.pointCategoryId) {
            hasMatch = allowedPointCatIds.has(Number(evt.pointCategoryId))
          }
          if (!hasMatch) return false
        } else {
          return false
        }
      }

      // 4. Tiêu chuẩn SV5T (Hỗ trợ multi-select)
      if (selectedCriteriaIds.length > 0) {
        const allowedCritIds = new Set<string>()
        const critNames: string[] = []

        selectedCriteriaIds.forEach((cid) => {
          allowedCritIds.add(cid)
          const crit = options?.criterias?.find((c) => String(c.id) === cid)
          if (crit?.childIds) {
            crit.childIds.forEach((id) => allowedCritIds.add(String(id)))
          }
          if (crit?.label) {
            critNames.push(crit.label.toLowerCase().replace('tiêu chuẩn', '').trim())
          }
        })

        const hasCritMatch =
          (evt.criteriaId && allowedCritIds.has(String(evt.criteriaId))) ||
          (evt.criteriaName &&
            critNames.some((cn) => cn && evt.criteriaName.toLowerCase().includes(cn)))

        if (!hasCritMatch) return false
      }

      // 5. Đơn vị tổ chức (Hỗ trợ multi-select)
      if (!hideFanpageFilter) {
        if (selectedFanpageIds.length > 0) {
          const evtOrgId = String(evt.organizerId || evt.fanpageId || '')
          if (!selectedFanpageIds.includes(evtOrgId)) return false
        } else if (formValues.fanpageId) {
          if (String(evt.organizerId || evt.fanpageId || '') !== String(formValues.fanpageId)) return false
        }
      }

      // 6. Năm học (Nâng cao)
      if (selectedAcademicYear && selectedAcademicYear !== 'ALL') {
        const evtSemId = String(evt.semesterId || evt.semester?.id || '')
        if (evtSemId && matchingYearSemesterIds.size > 0) {
          if (!matchingYearSemesterIds.has(evtSemId)) return false
        }
      }

      // 7. Học kỳ (Nâng cao)
      if (formValues.semesterId && formValues.semesterId !== 'ALL') {
        const evtSemId = String(evt.semesterId || evt.semester?.id || '')
        if (evtSemId !== String(formValues.semesterId)) return false
      }

      // 8. Khoảng thời gian
      if (formValues.dateHappenFrom) {
        const evtDate = evt.startTime || evt.dateHappen || evt.createdAt
        if (evtDate && evtDate < formValues.dateHappenFrom) return false
      }
      if (formValues.dateHappenTo) {
        const evtDate = evt.endTime || evt.startTime || evt.dateHappen || evt.createdAt
        if (evtDate && evtDate.slice(0, 10) > formValues.dateHappenTo) return false
      }

      return true
    }).length
  }, [
    previewSourceEvents,
    selectedStatuses,
    selectedTypeIds,
    selectedPointCategoryIds,
    selectedCriteriaIds,
    selectedFanpageIds,
    selectedAcademicYear,
    formValues,
    options?.pointCategories,
    options?.criterias,
    options?.semesters,
  ])

  const activeCount = Object.values({
    ...formValues,
    academicYear: selectedAcademicYear !== 'ALL' ? selectedAcademicYear : undefined,
    fanpageId: undefined,
  }).filter(Boolean).length + (selectedFanpageIds.length > 0 ? 1 : 0)

  // Đếm số lượng bộ lọc đang bật bên trong phần Nâng cao
  const advancedActiveCount = [
    selectedAcademicYear !== 'ALL' ? selectedAcademicYear : null,
    formValues.semesterId && formValues.semesterId !== 'ALL' ? formValues.semesterId : null,
    !hideFanpageFilter && selectedFanpageIds.length > 0 ? true : null,
  ].filter(Boolean).length

  const hasActiveFilters =
    activeCount > 0 ||
    selectedFanpageIds.length > 0 ||
    timePreset !== null ||
    Boolean(formValues.dateHappenFrom) ||
    Boolean(formValues.dateHappenTo) ||
    (selectedAcademicYear && selectedAcademicYear !== 'ALL')

  // Phân nhóm đơn vị tổ chức: "Đang theo dõi" đưa lên đầu, sau đó đến "Tất cả đơn vị"
  const followedIds = useMemo(() => {
    return new Set(followedFanpages.map((fp: any) => String(fp.id)))
  }, [followedFanpages])

  const followedFanpagesList = useMemo(() => {
    return (options?.fanpages || []).filter((fp) => followedIds.has(String(fp.id)))
  }, [options?.fanpages, followedIds])

  const otherFanpagesList = useMemo(() => {
    return (options?.fanpages || []).filter((fp) => !followedIds.has(String(fp.id)))
  }, [options?.fanpages, followedIds])

  const searchLower = fanpageSearch.trim().toLowerCase()
  const filterList = (list: any[]) =>
    searchLower ? list.filter((fp) => fp.label.toLowerCase().includes(searchLower)) : list

  const filteredFollowed = useMemo(
    () => filterList(followedFanpagesList),
    [followedFanpagesList, searchLower]
  )
  const filteredOthers = useMemo(
    () =>
      followedFanpagesList.length > 0
        ? filterList(otherFanpagesList)
        : filterList(options?.fanpages || []),
    [followedFanpagesList.length, otherFanpagesList, options?.fanpages, searchLower]
  )
  const totalFilteredCount =
    (followedFanpagesList.length > 0 ? filteredFollowed.length : 0) + filteredOthers.length

  // Style chips chuẩn: Nổi bật rõ nét khi chọn (Nền xanh đặc chữ trắng), êm dịu khi chưa chọn
  const getChipClass = (isSelected: boolean) =>
    isSelected
      ? 'px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground shadow-xs border border-primary transition-all cursor-pointer ring-2 ring-primary/20'
      : 'px-3 py-1.5 rounded-xl text-xs font-medium bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/70 transition-all cursor-pointer'

  if (!isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end pointer-events-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity pointer-events-auto"
        onClick={() => {
          setOpenCombobox(null)
          onClose()
        }}
      />

      {/* Filter Drawer: Right Slide-over on Desktop, Bottom Sheet on Mobile */}
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative pointer-events-auto w-full sm:w-[480px] sm:max-w-[480px] h-auto max-h-[90vh] sm:max-h-full sm:h-full overflow-hidden bg-white dark:bg-card border-t sm:border-t-0 sm:border-l border-border/80 rounded-t-3xl sm:rounded-none shadow-2xl text-left animate-in slide-in-from-bottom-6 sm:slide-in-from-right duration-300 select-none flex flex-col"
      >
        {/* Mobile Swipe Handle Indicator */}
        <div className="pt-2.5 pb-1 sm:hidden flex justify-center">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border/50 shrink-0 bg-muted/20">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-k2d font-bold text-base sm:text-lg text-foreground tracking-tight">
                Bộ lọc sự kiện
              </h2>
              {activeCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                  {activeCount} đang chọn
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tùy chỉnh tiêu chí tìm kiếm sự kiện phù hợp
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            aria-label="Đóng bộ lọc"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filter Content - Cuộn mượt mà */}
        <div className="px-5 sm:px-6 py-4 space-y-4 overflow-y-auto custom-scrollbar flex-1 divide-y divide-border/40">
          {/* ============================================================ */}
          {/* 1. Trạng thái (hay dùng nhất - Không cần chip Tất cả)        */}
          {/* ============================================================ */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-foreground/80 block">
              Trạng thái sự kiện
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {STATUS_CHIPS.map((chip) => {
                const isSelected = selectedStatuses.includes(chip.key)
                return (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => handleToggleStatus(chip.key)}
                    className={getChipClass(isSelected)}
                  >
                    {chip.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ============================================================ */}
          {/* 2. Thời gian tổ chức (Chip nhanh + Xổ Date Range ngay bên dưới) */}
          {/* ============================================================ */}
          <div className="pt-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground/80 block">
                Thời gian
              </span>
              {(formValues.dateHappenFrom || formValues.dateHappenTo) && (
                <span className="text-[11px] text-primary font-medium">
                  {formValues.dateHappenFrom && formValues.dateHappenTo
                    ? `${formValues.dateHappenFrom} → ${formValues.dateHappenTo}`
                    : formValues.dateHappenFrom || formValues.dateHappenTo}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleSelectTimePreset('TODAY')}
                className={getChipClass(timePreset === 'TODAY')}
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => handleSelectTimePreset('THIS_WEEK')}
                className={getChipClass(timePreset === 'THIS_WEEK')}
              >
                Tuần này
              </button>
              <button
                type="button"
                onClick={() => handleSelectTimePreset('THIS_MONTH')}
                className={getChipClass(timePreset === 'THIS_MONTH')}
              >
                Tháng này
              </button>
              <button
                type="button"
                onClick={() => handleSelectTimePreset('CUSTOM')}
                className={getChipClass(timePreset === 'CUSTOM')}
              >
                Tùy chọn...
              </button>
            </div>

            {/* Xổ Date Range Picker thanh mảnh ngay bên dưới khi chọn Tùy chọn */}
            {timePreset === 'CUSTOM' && (
              <div className="pt-2 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="flex-1">
                  <DatePicker
                    value={formValues.dateHappenFrom || ''}
                    onChange={(val) => setFormValues((prev) => ({ ...prev, dateHappenFrom: val }))}
                    placeholder="Từ ngày: dd/mm/yyyy"
                    className="w-full h-9 text-xs rounded-xl"
                  />
                </div>
                <span className="text-muted-foreground text-xs font-medium shrink-0">→</span>
                <div className="flex-1">
                  <DatePicker
                    value={formValues.dateHappenTo || ''}
                    onChange={(val) => setFormValues((prev) => ({ ...prev, dateHappenTo: val }))}
                    placeholder="Đến ngày: dd/mm/yyyy"
                    className="w-full h-9 text-xs rounded-xl"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* 3. Loại hình sự kiện (Combobox multi-select)                 */}
          {/* ============================================================ */}
          <div className="pt-3.5 space-y-1 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground/80 block">
                Loại hình sự kiện
              </span>
              {selectedTypeIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearTypes}
                  className="text-[11px] text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
                >
                  Xóa chọn ({selectedTypeIds.length})
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setOpenCombobox(openCombobox === 'eventType' ? null : 'eventType')}
              className={`w-full h-9 px-3 rounded-xl border bg-background text-xs text-foreground flex items-center justify-between gap-2 hover:bg-accent/40 focus:outline-none transition-all cursor-pointer text-left ${
                selectedTypeIds.length > 0
                  ? 'border-primary/60 text-primary font-semibold ring-1 ring-primary/20'
                  : 'border-input text-muted-foreground'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {selectedTypeIds.length === 0 ? (
                  <span className="truncate">Tất cả loại hình</span>
                ) : selectedTypeIds.length === 1 ? (
                  (() => {
                    const et = options?.eventTypes?.find((t) => String(t.id) === selectedTypeIds[0])
                    return <span className="truncate">{et?.label || `Loại hình #${selectedTypeIds[0]}`}</span>
                  })()
                ) : (
                  (() => {
                    const et = options?.eventTypes?.find((t) => String(t.id) === selectedTypeIds[0])
                    return (
                      <>
                        <span className="truncate font-semibold">{et?.label || 'Loại hình'}</span>
                        <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                          +{selectedTypeIds.length - 1}
                        </span>
                      </>
                    )
                  })()
                )}
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </button>

            {openCombobox === 'eventType' && (
              <div className="absolute top-full mt-1.5 left-0 right-0 bg-popover border border-border rounded-xl shadow-xl z-50 max-h-56 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
                <div className="p-2 border-b border-border bg-muted/30 flex items-center gap-2 shrink-0">
                  <SearchIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    value={eventTypeSearch}
                    onChange={(e) => setEventTypeSearch(e.target.value)}
                    placeholder="Tìm loại hình sự kiện..."
                    className="w-full text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                    autoFocus
                  />
                </div>
                <div className="overflow-y-auto custom-scrollbar p-1 flex-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={handleClearTypes}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                      selectedTypeIds.length === 0
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-foreground/80 hover:text-foreground hover:bg-muted/40'
                    }`}
                  >
                    <span>Tất cả loại hình</span>
                    {selectedTypeIds.length === 0 && (
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    )}
                  </button>

                  {filteredEventTypes.length === 0 ? (
                    <div className="py-6 px-3 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-1.5">
                      <SearchIcon className="h-4 w-4 text-muted-foreground/50" />
                      <span>Không tìm thấy loại hình nào</span>
                    </div>
                  ) : (
                    filteredEventTypes.map((et) => {
                      const isSelected = selectedTypeIds.includes(String(et.id))
                      return (
                        <button
                          key={et.id}
                          type="button"
                          onClick={() => handleToggleType(String(et.id))}
                          className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                            isSelected
                              ? 'bg-primary/10 text-primary font-semibold'
                              : 'text-foreground/80 hover:text-foreground hover:bg-muted/40'
                          }`}
                        >
                          <span className="truncate">{et.label}</span>
                          <div
                            className={`h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'border-muted-foreground/30 bg-background'
                            }`}
                          >
                            {isSelected && <Check className="h-2.5 w-2.5 stroke-[2.5]" />}
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* 4. Quyền lợi sinh viên (Mục ĐRL I-V và Tiêu chuẩn SV5T)       */}
          {/* ============================================================ */}
          <div className="pt-3.5 space-y-3">
            {/* 4.1 Mục Điểm rèn luyện (ĐRL) */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground/80 block">
                Mục Điểm rèn luyện (ĐRL)
              </span>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {rootPointCategories.map((pc) => {
                  const isDirectlySelected = selectedPointCategoryIds.includes(String(pc.id))
                  const hasSelectedChildren = childPointCategories.some(
                    (cpc) =>
                      String(cpc.parentCategoryId) === String(pc.id) &&
                      selectedPointCategoryIds.includes(String(cpc.id))
                  )
                  const isSelected = isDirectlySelected || hasSelectedChildren

                  return (
                    <button
                      key={pc.id}
                      type="button"
                      title={pc.note || pc.label}
                      onClick={() => handleTogglePointCategory(String(pc.id))}
                      className={getChipClass(isSelected)}
                    >
                      {pc.label}
                    </button>
                  )
                })}
              </div>

              {/* Nếu có mục con chi tiết (I.a, I.b...) và người dùng đang chọn mục lớn */}
              {childPointCategories.length > 0 && (
                (() => {
                  const activeRootIds = rootPointCategories
                    .filter((rpc) => {
                      const rootIdStr = String(rpc.id)
                      return (
                        selectedPointCategoryIds.includes(rootIdStr) ||
                        childPointCategories.some(
                          (cpc) =>
                            String(cpc.parentCategoryId) === rootIdStr &&
                            selectedPointCategoryIds.includes(String(cpc.id))
                        )
                      )
                    })
                    .map((rpc) => String(rpc.id))

                  if (activeRootIds.length === 0) return null

                  const relevantChildren = childPointCategories.filter((cpc) =>
                    activeRootIds.includes(String(cpc.parentCategoryId))
                  )

                  if (relevantChildren.length === 0) return null

                  return (
                    <div className="pt-1.5 pl-1 border-l-2 border-primary/30 space-y-1 animate-in fade-in duration-150">
                      <span className="text-[11px] font-medium text-muted-foreground block">
                        Chi tiết theo mục con:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {relevantChildren.map((cpc) => {
                          const isSubSelected = selectedPointCategoryIds.includes(String(cpc.id))
                          return (
                            <button
                              key={cpc.id}
                              type="button"
                              title={cpc.note || cpc.label}
                              onClick={() => handleTogglePointCategory(String(cpc.id))}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                                isSubSelected
                                  ? 'bg-primary text-primary-foreground font-semibold border-primary ring-1 ring-primary/20'
                                  : 'bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground border-border/60'
                              }`}
                            >
                              {cpc.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()
              )}
            </div>

            {/* 4.2 Tiêu chuẩn SV5T - Dạng chip multi-select */}
            <div className="pt-3 pb-3 border-t border-border/40 space-y-2">
              <span className="text-xs font-semibold text-foreground/80 block">
                Tiêu chuẩn Sinh viên 5 tốt (SV5T)
              </span>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {(options?.criterias || []).map((c) => {
                  const isSelected = selectedCriteriaIds.includes(String(c.id))
                  return (
                    <button
                      key={c.id}
                      type="button"
                      title={c.note || c.label}
                      onClick={() => handleToggleCriteria(String(c.id))}
                      className={getChipClass(isSelected)}
                    >
                      {c.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 5. Nâng cao (Thu gọn / Accordion với Badge đếm số bộ lọc ẩn)   */}
          {/* ============================================================ */}
          <div ref={advancedRef} className="pt-4 border-t border-border/60 space-y-3">
            <button
              type="button"
              onClick={handleToggleAdvanced}
              className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground py-1.5 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                <span>
                  {hideFanpageFilter
                    ? 'Nâng cao (Năm học, Học kỳ)'
                    : 'Nâng cao (Năm học, Học kỳ, Đơn vị tổ chức)'}
                </span>
                {advancedActiveCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                    · {advancedActiveCount}
                  </span>
                )}
              </div>
              {isAdvancedOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            <div
              className={`pt-2 space-y-3 transition-all ${isAdvancedOpen ? 'block animate-in fade-in slide-in-from-top-1 duration-150' : 'hidden'
                }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Năm học */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground block">
                    Năm học
                  </label>
                  <Select
                    value={selectedAcademicYear}
                    onValueChange={(val) => {
                      setSelectedAcademicYear(val)
                      setFormValues((prev) => ({
                        ...prev,
                        academicYear: val === 'ALL' ? undefined : val,
                      }))
                    }}
                  >
                    <SelectTrigger className="w-full h-9 text-xs rounded-xl">
                      <SelectValue placeholder="Tất cả năm học" />
                    </SelectTrigger>
                    <SelectContent className="z-[70] bg-white dark:bg-card border border-border shadow-xl max-h-56">
                      <SelectItem value="ALL">Tất cả năm học</SelectItem>
                      {(options?.academicYears || []).map((ay) => (
                        <SelectItem key={ay.id} value={String(ay.label || ay.note)}>
                          {ay.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Học kỳ */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground block">
                    Học kỳ
                  </label>
                  <Select
                    value={formValues.semesterId || 'ALL'}
                    onValueChange={(val) =>
                      setFormValues((prev) => ({
                        ...prev,
                        semesterId: val === 'ALL' ? undefined : val,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full h-9 text-xs rounded-xl">
                      <SelectValue placeholder="Tất cả học kỳ" />
                    </SelectTrigger>
                    <SelectContent className="z-[70] bg-white dark:bg-card border border-border shadow-xl max-h-56">
                      <SelectItem value="ALL">Tất cả học kỳ</SelectItem>
                      {availableSemesters.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.shortLabel || `HK${s.number === 3 ? 'Hè' : (s.number || 1)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Đơn vị tổ chức (Fanpage Combobox - Hỗ trợ multi-select, Nhóm Đang theo dõi, Mở lên trên tránh bị cắt) */}
              {!hideFanpageFilter && (
                <div className="space-y-1 relative">
                  <label className="text-[11px] font-medium text-muted-foreground block">
                    Đơn vị tổ chức (Fanpage)
                  </label>
                <button
                  type="button"
                  onClick={() => setOpenCombobox(openCombobox === 'fanpage' ? null : 'fanpage')}
                  className={`w-full h-9 px-3 rounded-xl border bg-background text-xs text-foreground flex items-center justify-between gap-2 hover:bg-accent/40 focus:outline-none transition-all cursor-pointer text-left ${selectedFanpageIds.length > 0
                      ? 'border-primary/60 text-primary font-semibold ring-1 ring-primary/20'
                      : 'border-input text-muted-foreground'
                    }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {selectedFanpageIds.length === 0 ? (
                      <span className="truncate">Tất cả đơn vị</span>
                    ) : selectedFanpageIds.length === 1 ? (
                      (() => {
                        const fp = options?.fanpages?.find((f) => String(f.id) === selectedFanpageIds[0])
                        return (
                          <>
                            {fp?.avatarUrl && (
                              <img
                                src={fp.avatarUrl}
                                alt={fp.label}
                                className="h-4 w-4 rounded-full object-cover shrink-0 border border-border"
                              />
                            )}
                            <span className="truncate">{fp?.label || `Đơn vị #${selectedFanpageIds[0]}`}</span>
                          </>
                        )
                      })()
                    ) : (
                      (() => {
                        const fp = options?.fanpages?.find((f) => String(f.id) === selectedFanpageIds[0])
                        return (
                          <>
                            {fp?.avatarUrl && (
                              <img
                                src={fp.avatarUrl}
                                alt={fp.label}
                                className="h-4 w-4 rounded-full object-cover shrink-0 border border-border"
                              />
                            )}
                            <span className="truncate font-semibold">{fp?.label || 'Đơn vị'}</span>
                            <span className="shrink-0 px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                              +{selectedFanpageIds.length - 1}
                            </span>
                          </>
                        )
                      })()
                    )}
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </button>

                {openCombobox === 'fanpage' && (
                  <div className="absolute bottom-full mb-1.5 left-0 right-0 bg-popover border border-border rounded-xl shadow-xl z-50 max-h-52 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
                    {/* Header ô tìm kiếm cố định */}
                    <div className="p-2 border-b border-border bg-muted/30 flex items-center gap-2 shrink-0">
                      <SearchIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <input
                        type="text"
                        value={fanpageSearch}
                        onChange={(e) => setFanpageSearch(e.target.value)}
                        placeholder="Tìm đơn vị tổ chức..."
                        className="w-full text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                        autoFocus
                      />
                    </div>

                    {/* Danh sách cuộn mượt mà có giới hạn chiều cao */}
                    <div className="overflow-y-auto custom-scrollbar p-1 flex-1 space-y-0.5">
                      {/* Tùy chọn: Tất cả đơn vị */}
                      <button
                        type="button"
                        onClick={handleClearFanpages}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${selectedFanpageIds.length === 0
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-foreground/80 hover:text-foreground hover:bg-muted/40'
                          }`}
                      >
                        <span>Tất cả đơn vị</span>
                        {selectedFanpageIds.length === 0 && (
                          <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                        )}
                      </button>

                      {totalFilteredCount === 0 ? (
                        <div className="py-6 px-3 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-1.5">
                          <SearchIcon className="h-4 w-4 text-muted-foreground/50" />
                          <span>Không tìm thấy đơn vị nào</span>
                        </div>
                      ) : (
                        <>
                          {/* Nhóm: Đang theo dõi */}
                          {filteredFollowed.length > 0 && (
                            <>
                              <div className="px-2.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-primary/80 flex items-center justify-between">
                                <span>Đang theo dõi</span>
                                <span className="text-[10px] font-normal text-muted-foreground">
                                  ({filteredFollowed.length})
                                </span>
                              </div>
                              {filteredFollowed.map((fp) => {
                                const isSelected = selectedFanpageIds.includes(String(fp.id))
                                return (
                                  <button
                                    key={fp.id}
                                    type="button"
                                    onClick={() => handleToggleFanpage(String(fp.id))}
                                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${isSelected
                                        ? 'bg-primary/10 text-primary font-semibold'
                                        : 'text-foreground/80 hover:text-foreground hover:bg-muted/40'
                                      }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <img
                                        src={fp.avatarUrl}
                                        alt={fp.label}
                                        className="h-4 w-4 rounded-full object-cover shrink-0 border border-border"
                                      />
                                      <span className="truncate">{fp.label}</span>
                                    </div>
                                    <div
                                      className={`h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected
                                          ? 'bg-primary border-primary text-primary-foreground'
                                          : 'border-muted-foreground/30 bg-background'
                                        }`}
                                    >
                                      {isSelected && <Check className="h-2.5 w-2.5 stroke-[2.5]" />}
                                    </div>
                                  </button>
                                )
                              })}
                            </>
                          )}

                          {/* Nhóm: Đơn vị khác / Tất cả đơn vị */}
                          {filteredOthers.length > 0 && (
                            <>
                              {followedFanpagesList.length > 0 && (
                                <div className="px-2.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between border-t border-border/40 mt-1">
                                  <span>Đơn vị khác</span>
                                </div>
                              )}
                              {filteredOthers.map((fp) => {
                                const isSelected = selectedFanpageIds.includes(String(fp.id))
                                return (
                                  <button
                                    key={fp.id}
                                    type="button"
                                    onClick={() => handleToggleFanpage(String(fp.id))}
                                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${isSelected
                                        ? 'bg-primary/10 text-primary font-semibold'
                                        : 'text-foreground/80 hover:text-foreground hover:bg-muted/40'
                                      }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <img
                                        src={fp.avatarUrl}
                                        alt={fp.label}
                                        className="h-4 w-4 rounded-full object-cover shrink-0 border border-border"
                                      />
                                      <span className="truncate">{fp.label}</span>
                                    </div>
                                    <div
                                      className={`h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected
                                          ? 'bg-primary border-primary text-primary-foreground'
                                          : 'border-muted-foreground/30 bg-background'
                                        }`}
                                    >
                                      {isSelected && <Check className="h-2.5 w-2.5 stroke-[2.5]" />}
                                    </div>
                                  </button>
                                )
                              })}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white/95 dark:bg-card/95 backdrop-blur border-t border-border/60 px-5 sm:px-6 py-3.5 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            disabled={!hasActiveFilters}
            className={`text-xs flex items-center gap-1.5 py-1 transition-colors ${hasActiveFilters
                ? 'text-muted-foreground hover:text-foreground hover:underline cursor-pointer'
                : 'text-muted-foreground/40 cursor-not-allowed pointer-events-none'
              }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Thiết lập lại {activeCount > 0 ? `(${activeCount})` : ''}</span>
          </button>

          <Button
            type="button"
            onClick={handleApply}
            className="h-10 px-6 rounded-xl text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-all bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer active:scale-[0.98]"
          >
            <Check className="h-4 w-4" />
            <span>
              {previewMatchingCount > 0
                ? `Xem ${previewMatchingCount} sự kiện`
                : 'Xem kết quả'}
            </span>
          </Button>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent
}

export const EventFilterDrawer = EventFilterModal
