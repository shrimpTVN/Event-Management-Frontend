import React, { useState, useRef, useMemo, useEffect } from 'react'
import { normalizeAttendanceConfig } from '@/shared/utils/attendanceConfig'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  MapPin,
  Upload,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  Search,
  ChevronDown,
  Loader2,
} from 'lucide-react'
import { mediaService } from '@/shared'
import { trainingPointsService } from '@/features/training-points/services/trainingPointsService'
import { cn } from '@/shared/utils/cn'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { TimeSelect } from '@/components/ui/time-select'
import {
  SelectPointCategoriesModal,
  type SelectedPointCategory,
} from './SelectPointCategoriesModal'
import {
  SelectSv5tCriteriaModal,
  flattenCriteriaSelection,
  SCOPE_LABELS,
  type SelectedSv5tCriteria,
} from './SelectSv5tCriteriaModal'
import type {
  AdminEvent,
  FanpageSummary,
  PointCategoryItem,
  Sv5tCriteriaItem,
} from '../types/fanpageAdmin.types'
import { MOCK_EVENT_TYPES, fanpageAdminService } from '../services/fanpageAdminService'
import {
  validateEventForm,
  localDateTime,
  eventApiErrors,
  type EventFormErrors,
} from '../utils/eventFormValidation'

const EMPTY_CRITERIAS: Sv5tCriteriaItem[] = []

interface FanpageCreateEventViewProps {
  currentFanpage: FanpageSummary
  onBack: () => void
  onSaveEvent: (newEvent: Partial<AdminEvent>, isPublished: boolean) => void
  initialEvent?: AdminEvent | null
}

// Converts an ISO string or any date string to local YYYY-MM-DD
function parseIsoToLocalDate(dateStr?: string | null): string {
  if (!dateStr) return ''
  const trimmed = dateStr.trim()
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/')
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
      }
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
      }
    }
  }
  const d = new Date(trimmed)
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  return trimmed.split('T')[0] || ''
}

// Converts an ISO string or time string to local HH:mm
function parseIsoToLocalTime(dateStr?: string | null, defaultTime = '08:00'): string {
  if (!dateStr) return defaultTime
  const trimmed = dateStr.trim()
  if (/^\d{2}:\d{2}$/.test(trimmed)) return trimmed
  const d = new Date(trimmed)
  if (!isNaN(d.getTime())) {
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }
  return defaultTime
}

export const FanpageCreateEventView: React.FC<FanpageCreateEventViewProps> = ({
  currentFanpage,
  onBack,
  onSaveEvent,
  initialEvent,
}) => {
  const isEditMode = Boolean(initialEvent)
  const formRef = useRef<HTMLDivElement>(null)
  const [showValidation, setShowValidation] = useState(false)
  const [serverErrors, setServerErrors] = useState<EventFormErrors>({})
  const [submitError, setSubmitError] = useState('')
  const [submitAttempt, setSubmitAttempt] = useState(0)
  const [savedEventId, setSavedEventId] = useState<string | null>(initialEvent?.id || null)
  const persistedStatus = useRef(initialEvent?.status || 'DRAFT')

  // 1. Thông tin cơ bản & Học kỳ (Schema: name, eventTypeId, semesterId, fanpageId, format, location)
  const [name, setName] = useState(initialEvent?.name || '')
  const [eventTypeId, setEventTypeId] = useState<number>(initialEvent?.eventTypeId || 1)
  const [semesterId, setSemesterId] = useState<number>(initialEvent?.semesterId || 0)
  const [academicYearId, setAcademicYearId] = useState(0)
  const restoredYear = useRef('')
  const { data: academicYears = [] } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => trainingPointsService.getAcademicYears(),
  })
  const { data: semesters = [] } = useQuery({
    queryKey: ['semesters'],
    queryFn: () => trainingPointsService.getSemesters(),
  })
  const yearIdForSemester = (semester: (typeof semesters)[number]) =>
    semester.academicYearId ?? academicYears.find((year) => year.code === semester.academicYear)?.id
  const availableSemesters = semesters
    .filter((semester) => yearIdForSemester(semester) === academicYearId)
    .sort((a, b) => a.number - b.number)
  const selectedAcademicYear = academicYears.find((year) => year.id === academicYearId)
  useEffect(() => {
    if (!initialEvent) {
      restoredYear.current = ''
      return
    }
    const key = `${initialEvent.id}:${initialEvent.semesterId}`
    if (restoredYear.current === key) return
    const semester = semesters.find((item) => item.id === initialEvent.semesterId)
    const yearId =
      semester &&
      (semester.academicYearId ??
        academicYears.find((year) => year.code === semester.academicYear)?.id)
    if (yearId && academicYears.some((year) => year.id === yearId)) {
      setAcademicYearId(yearId)
      restoredYear.current = key
    }
  }, [initialEvent, semesters, academicYears])
  const [format, setFormat] = useState<'OFFLINE' | 'ONLINE' | 'HYBRID'>(
    initialEvent?.format || 'OFFLINE'
  )
  const [location, setLocation] = useState(initialEvent?.location || '')

  // 2. Thời gian tổ chức & Thời gian mở/đóng đăng ký (Schema: dateHappen, dateOpen, dateClose)
  const [dateHappen, setDateHappen] = useState(
    parseIsoToLocalDate(initialEvent?.dateStart || initialEvent?.dateHappen)
  )
  const [timeStart, setTimeStart] = useState(
    parseIsoToLocalTime(initialEvent?.timeStart || initialEvent?.dateHappen, '08:00')
  )
  const [timeEnd, setTimeEnd] = useState(parseIsoToLocalTime(initialEvent?.timeEnd, '11:30'))
  const [dateOpen, setDateOpen] = useState(() =>
    parseIsoToLocalDate(initialEvent?.dateOpen || new Date().toISOString())
  )
  const [timeOpen, setTimeOpen] = useState(() =>
    parseIsoToLocalTime(initialEvent?.dateOpen || new Date().toISOString())
  )
  const [dateClose, setDateClose] = useState(parseIsoToLocalDate(initialEvent?.dateClose))
  const [timeClose, setTimeClose] = useState(parseIsoToLocalTime(initialEvent?.dateClose, '23:59'))

  // 3. Quy mô & Hình thức đăng ký (Schema: capacity, male_quantity, female_quantity, requiresApproval)
  const [capacity, setCapacity] = useState<number | ''>(
    initialEvent && initialEvent.capacity ? initialEvent.capacity : ''
  )
  const [maleQuantity, setMaleQuantity] = useState<number | ''>(
    initialEvent && initialEvent.maleQuantity !== undefined ? initialEvent.maleQuantity : ''
  )
  const [femaleQuantity, setFemaleQuantity] = useState<number | ''>(
    initialEvent && initialEvent.femaleQuantity !== undefined ? initialEvent.femaleQuantity : ''
  )
  const [requiresApproval, setRequiresApproval] = useState<boolean>(
    initialEvent ? Boolean(initialEvent.requiresApproval) : false
  )

  // 4. Cấu hình điểm danh (attendanceMethod, attendanceSessionType)
  const [attendanceMethod, setAttendanceMethod] = useState<'MANUAL' | 'STUDENT_PROOF'>(
    normalizeAttendanceConfig(initialEvent ?? {}).attendanceMethod
  )
  const [attendanceSessionType, setAttendanceSessionType] = useState<'START' | 'END' | 'BOTH'>(
    normalizeAttendanceConfig(initialEvent ?? {}).attendanceSessionType
  )

  // 5. Quyền lợi sinh viên - Phân cấp Điểm rèn luyện & Tiêu chí SV5T
  const { data: pointCategories = [] } = useQuery<PointCategoryItem[]>({
    queryKey: ['pointCategories'],
    queryFn: () => fanpageAdminService.getPointCategories(),
  })

  const { data: sv5tCriterias = EMPTY_CRITERIAS } = useQuery<Sv5tCriteriaItem[]>({
    queryKey: ['sv5tCriterias'],
    queryFn: () => fanpageAdminService.getSv5tCriterias(),
  })

  // Lấy danh sách loại sự kiện thực tế từ Backend API & Combobox state
  const { data: eventTypeList = [] } = useQuery({
    queryKey: ['admin-event-types'],
    queryFn: () => fanpageAdminService.getEventTypes(),
  })
  const [isEventTypeOpen, setIsEventTypeOpen] = useState(false)
  const [eventTypeSearch, setEventTypeSearch] = useState('')
  const eventTypeComboboxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        eventTypeComboboxRef.current &&
        !eventTypeComboboxRef.current.contains(e.target as Node)
      ) {
        setIsEventTypeOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredEventTypes = useMemo(() => {
    if (!eventTypeSearch.trim()) return eventTypeList
    const q = eventTypeSearch.toLowerCase()
    return eventTypeList.filter((t) => t.name.toLowerCase().includes(q))
  }, [eventTypeList, eventTypeSearch])

  const selectedEventTypeObj = useMemo(() => {
    return eventTypeList.find((t) => t.id === eventTypeId)
  }, [eventTypeList, eventTypeId])

  // Modal và danh sách mục Điểm rèn luyện đã chọn (hỗ trợ chọn nhiều mục)
  const [isPointModalOpen, setIsPointModalOpen] = useState(false)
  const [selectedPointCategories, setSelectedPointCategories] = useState<SelectedPointCategory[]>(
    () => {
      if (initialEvent?.eventPoints && initialEvent.eventPoints.length > 0) {
        return initialEvent.eventPoints
      }
      if (initialEvent?.trainingPointCategoryId) {
        return [
          {
            pointCategoryId: initialEvent.trainingPointCategoryId,
            pointCategoryName: initialEvent.trainingPointCategoryName || 'Điểm rèn luyện',
            pointCategoryCode: initialEvent.trainingPointCategoryCode,
            point: initialEvent.trainingPoints || 5,
          },
        ]
      }
      return []
    }
  )

  const totalTrainingPoints = useMemo(() => {
    return selectedPointCategories.reduce((sum, item) => sum + (item.point || 0), 0)
  }, [selectedPointCategories])

  // Tiêu chuẩn & Tiêu chí Sinh viên 5 Tốt
  const [selectedSv5tCriteria, setSelectedSv5tCriteria] = useState<SelectedSv5tCriteria[]>([])
  const [isSv5tModalOpen, setIsSv5tModalOpen] = useState(false)
  const [hasCertificate, setHasCertificate] = useState<boolean>(
    initialEvent ? Boolean(initialEvent.hasCertificate) : false
  )

  // 6. Nội dung & Poster (Schema: description, bannerUrl, tags)
  const [description, setDescription] = useState(initialEvent?.description || '')
  const [isExpandedDesc, setIsExpandedDesc] = useState(false)
  const [tags, setTags] = useState(
    initialEvent
      ? Array.isArray(initialEvent.tags)
        ? initialEvent.tags.join(', ')
        : initialEvent.tags || ''
      : ''
  )
  const [bannerPreview, setBannerPreview] = useState(initialEvent?.bannerUrl || '')
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validationErrors = validateEventForm(
    {
      name,
      description,
      location,
      semesterId,
      eventTypeId,
      capacity,
      maleQuantity,
      femaleQuantity,
      dateHappen,
      timeStart,
      timeEnd,
      dateOpen,
      timeOpen,
      dateClose,
      timeClose,
      hasBanner: Boolean(bannerPreview || bannerFile),
    },
    availableSemesters.map((item) => item.id),
    eventTypeList.map((item) => item.id)
  )
  if (!selectedAcademicYear) validationErrors.academicYearId = 'Vui lòng chọn năm học.'
  const errors: EventFormErrors = {
    ...(showValidation ? validationErrors : {}),
    ...(dateClose && validationErrors.dateClose ? { dateClose: validationErrors.dateClose } : {}),
    ...serverErrors,
  }
  const errorProps = (field: string) => ({
    'aria-invalid': Boolean(errors[field]),
    'aria-describedby': errors[field] ? `event-error-${field}` : undefined,
  })
  const fieldError = (field: string) =>
    errors[field] ? (
      <p id={`event-error-${field}`} role="alert" className="text-xs text-destructive">
        {errors[field]}
      </p>
    ) : null
  const earliestClose = localDateTime(dateOpen, timeOpen) + 60_000
  const minCloseDate = Number.isFinite(earliestClose)
    ? parseIsoToLocalDate(new Date(earliestClose).toISOString())
    : undefined
  const minCloseTime =
    dateClose === minCloseDate && Number.isFinite(earliestClose)
      ? parseIsoToLocalTime(new Date(earliestClose).toISOString())
      : undefined

  useEffect(() => {
    setServerErrors({})
    setSubmitError('')
  }, [
    name,
    description,
    location,
    semesterId,
    academicYearId,
    eventTypeId,
    capacity,
    maleQuantity,
    femaleQuantity,
    dateHappen,
    timeStart,
    timeEnd,
    dateOpen,
    timeOpen,
    dateClose,
    timeClose,
    format,
    attendanceMethod,
    attendanceSessionType,
    hasCertificate,
    tags,
    selectedPointCategories,
    selectedSv5tCriteria,
  ])
  useEffect(() => {
    if (!submitAttempt) return
    const firstInvalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
    const target =
      firstInvalid || formRef.current?.querySelector<HTMLElement>('[data-submit-error]')
    target?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
    firstInvalid?.focus()
  }, [submitAttempt])

  // Đồng bộ lại toàn bộ Form khi initialEvent thay đổi (chuyển đổi giữa Tạo mới và Chỉnh sửa)
  useEffect(() => {
    setShowValidation(false)
    setServerErrors({})
    setSubmitError('')
    setSavedEventId(initialEvent?.id || null)
    persistedStatus.current = initialEvent?.status || 'DRAFT'
    if (initialEvent) {
      setName(initialEvent.name || '')
      setEventTypeId(initialEvent.eventTypeId || 1)
      setSemesterId(initialEvent.semesterId || 0)
      setFormat(initialEvent.format || 'OFFLINE')
      setLocation(initialEvent.location || '')
      setDateHappen(parseIsoToLocalDate(initialEvent.dateStart || initialEvent.dateHappen))
      setTimeStart(parseIsoToLocalTime(initialEvent.timeStart || initialEvent.dateHappen, '08:00'))
      setTimeEnd(parseIsoToLocalTime(initialEvent.timeEnd, '11:30'))
      setDateOpen(parseIsoToLocalDate(initialEvent.dateOpen))
      setTimeOpen(parseIsoToLocalTime(initialEvent.dateOpen, '07:00'))
      setDateClose(parseIsoToLocalDate(initialEvent.dateClose))
      setTimeClose(parseIsoToLocalTime(initialEvent.dateClose, '23:59'))
      setCapacity(initialEvent.capacity || '')
      setMaleQuantity(initialEvent.maleQuantity !== undefined ? initialEvent.maleQuantity : '')
      setFemaleQuantity(
        initialEvent.femaleQuantity !== undefined ? initialEvent.femaleQuantity : ''
      )
      setRequiresApproval(Boolean(initialEvent.requiresApproval))
      const attendanceConfig = normalizeAttendanceConfig(initialEvent)
      setAttendanceMethod(attendanceConfig.attendanceMethod)
      setAttendanceSessionType(attendanceConfig.attendanceSessionType)
      if (initialEvent.eventPoints && initialEvent.eventPoints.length > 0) {
        setSelectedPointCategories(initialEvent.eventPoints)
      } else if (initialEvent.trainingPointCategoryId) {
        setSelectedPointCategories([
          {
            pointCategoryId: initialEvent.trainingPointCategoryId,
            pointCategoryName: initialEvent.trainingPointCategoryName || 'Điểm rèn luyện',
            pointCategoryCode: initialEvent.trainingPointCategoryCode,
            point: initialEvent.trainingPoints || 5,
          },
        ])
      } else {
        setSelectedPointCategories([])
      }
      setHasCertificate(Boolean(initialEvent.hasCertificate))
      setDescription(initialEvent.description || '')
      setTags(
        Array.isArray(initialEvent.tags) ? initialEvent.tags.join(', ') : initialEvent.tags || ''
      )
      setBannerPreview(initialEvent.bannerUrl || '')
      setBannerFile(null)
    } else {
      // Khởi tạo trạng thái trống khi Tạo sự kiện mới
      setName('')
      setEventTypeId(1)
      setSemesterId(0)
      setAcademicYearId(0)
      setFormat('OFFLINE')
      setLocation('')
      setDateHappen('')
      setTimeStart('08:00')
      setTimeEnd('11:30')
      const now = new Date().toISOString()
      setDateOpen(parseIsoToLocalDate(now))
      setTimeOpen(parseIsoToLocalTime(now))
      setDateClose('')
      setTimeClose('23:59')
      setCapacity('')
      setMaleQuantity('')
      setFemaleQuantity('')
      setRequiresApproval(false)
      setAttendanceMethod('MANUAL')
      setAttendanceSessionType('BOTH')
      setSelectedPointCategories([])
      setSelectedSv5tCriteria([])
      setHasCertificate(false)
      setDescription('')
      setTags('')
      setBannerPreview('')
      setBannerFile(null)
    }
  }, [initialEvent])

  // Tự động khôi phục Tiêu chí SV5T khi chỉnh sửa
  useEffect(() => {
    if (!initialEvent) return
    const ids =
      initialEvent.sv5tCriteriaIds ??
      (initialEvent.sv5tCriteriaId ? [initialEvent.sv5tCriteriaId] : [])
    const leaves = flattenCriteriaSelection(sv5tCriterias)
    setSelectedSv5tCriteria(
      ids.map(
        (id) =>
          leaves.find((leaf) => leaf.id === id) || {
            id,
            name: initialEvent.sv5tCriteriaName || `Tiêu chí #${id}`,
          }
      )
    )
  }, [initialEvent, sv5tCriterias])

  // Xử lý tải ảnh poster thật từ thiết bị kèm Live Preview trực tiếp
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setServerErrors({})
      setSubmitError('')
      setBannerFile(file)
      const previewUrl = URL.createObjectURL(file)
      setBannerPreview(previewUrl)
    }
  }

  // Chọn ảnh mẫu có sẵn
  const handleUseSampleImage = () => {
    setServerErrors({})
    setSubmitError('')
    setBannerFile(null)
    setBannerPreview(
      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80'
    )
  }

  // Xử lý submit form
  const handleSubmit = async (isPublished: boolean) => {
    if (isSubmitting) return
    setShowValidation(true)
    setServerErrors({})
    setSubmitError('')
    setSubmitAttempt((current) => current + 1)
    if (Object.keys(validationErrors).length) return
    const safeCapacity = Number(capacity)
    const safeMaleQuantity = Number(maleQuantity)
    const safeFemaleQuantity = Number(femaleQuantity)
    const formatToInstantIso = (date: string, time: string) =>
      new Date(localDateTime(date, time)).toISOString()
    const dateOpenIso = formatToInstantIso(dateOpen, timeOpen)
    const dateCloseIso = formatToInstantIso(dateClose, timeClose)
    const dateHappenIso = formatToInstantIso(dateHappen, timeStart)
    const dateEndIso = formatToInstantIso(dateHappen, timeEnd)

    setIsSubmitting(true)

    let finalBannerUrl = bannerPreview
    if (bannerFile) {
      setIsUploadingImage(true)
      try {
        finalBannerUrl = await mediaService.uploadImage(bannerFile, 'EVENT')
        setBannerPreview(finalBannerUrl)
        setBannerFile(null)
      } catch (uploadErr: any) {
        console.error('Lỗi upload ảnh poster lên Cloudinary:', uploadErr)
        setServerErrors({
          bannerUrl: uploadErr?.message || 'Không thể tải ảnh bìa. Vui lòng thử lại.',
        })
        setSubmitAttempt((current) => current + 1)
        setIsSubmitting(false)
        setIsUploadingImage(false)
        return
      } finally {
        setIsUploadingImage(false)
      }
    }

    const activeSv5tId = selectedSv5tCriteria[0]?.id
    const activeSv5tName = selectedSv5tCriteria.map((item) => item.name).join('; ')
    const selectedEventType =
      selectedEventTypeObj || MOCK_EVENT_TYPES.find((t) => t.id === eventTypeId)
    const selectedSemester = semesters.find((s) => s.id === semesterId)

    const effectiveDescription = description.trim()

    const eventPayload: Partial<AdminEvent> = {
      id: savedEventId || `evt-${Date.now()}`,
      code: initialEvent ? initialEvent.code : `EVT-${Math.floor(1000 + Math.random() * 9000)}`,
      name: name.trim(),
      description: effectiveDescription,
      eventTypeId: Number(eventTypeId || 1),
      eventTypeName: selectedEventType?.name || 'Học thuật · Công nghệ',
      semesterId: Number(semesterId || 1),
      semesterName: selectedSemester
        ? `Học kỳ ${selectedSemester.number} · ${selectedSemester.academicYear || selectedAcademicYear?.code || ''}`
        : undefined,
      fanpageId: currentFanpage?.id || '1',
      organizerName: currentFanpage?.name || 'Đoàn Trường CNTT & TT',
      dateStart: dateHappen,
      dateEnd: dateHappen,
      timeStart,
      timeEnd,
      dateOpen: dateOpenIso,
      dateClose: dateCloseIso,
      format,
      location: location.trim(),
      capacity: safeCapacity,
      maleQuantity: safeMaleQuantity,
      femaleQuantity: safeFemaleQuantity,
      registeredCount: initialEvent ? initialEvent.registeredCount : 0,
      checkedInCount: initialEvent ? initialEvent.checkedInCount : 0,
      status: isPublished ? 'PUBLISHED' : 'DRAFT',
      bannerUrl: finalBannerUrl,
      requiresApproval,
      allowSelfCheck: attendanceMethod === 'STUDENT_PROOF',
      attendanceMethod,
      attendanceSessionType,
      autoEmail: true,
      isPublic: true,
      trainingPointCategoryId: selectedPointCategories[0]?.pointCategoryId,
      trainingPointCategoryName: selectedPointCategories.map((c) => c.pointCategoryName).join('; '),
      trainingPointCategoryCode: selectedPointCategories
        .map((c) => c.pointCategoryCode)
        .filter(Boolean)
        .join(', '),
      trainingPoints: totalTrainingPoints,
      eventPoints: selectedPointCategories,
      sv5tCriteriaId: activeSv5tId,
      sv5tCriteriaIds: selectedSv5tCriteria.map((item) => item.id),
      sv5tCriteriaName: activeSv5tName,
      hasCertificate,
      tags: tags
        ? tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      createdAt: initialEvent ? initialEvent.createdAt : new Date().toISOString(),
    }

    const requestPayload = {
      name: eventPayload.name,
      description: eventPayload.description,
      location: eventPayload.location,
      dateHappen: dateHappenIso,
      dateEnd: dateEndIso,
      dateOpen: dateOpenIso,
      dateClose: dateCloseIso,
      capacity: safeCapacity,
      maleQuantity: safeMaleQuantity,
      femaleQuantity: safeFemaleQuantity,
      bannerUrl: finalBannerUrl,
      allowSelfCheck: attendanceMethod === 'STUDENT_PROOF',
      attendanceMethod,
      attendanceSessionType,
      format,
      requiresApproval,
      hasCertificate,
      tags: eventPayload.tags,
      criteriaIds: selectedSv5tCriteria.map((item) => item.id),
      eventTypeId: Number(eventTypeId),
      fanpageId: Number(currentFanpage.id),
      semesterId: Number(semesterId),
      criteriaId: activeSv5tId ? Number(activeSv5tId) : null,
      eventPoints: selectedPointCategories.map((item) => ({
        pointCategoryId: Number(item.pointCategoryId),
        point: Number(item.point),
      })),
    }
    let eventId = savedEventId
    let publishing = false
    try {
      if (eventId) await fanpageAdminService.updateAdminEvent(eventId, requestPayload)
      else {
        const created = await fanpageAdminService.createAdminEvent(requestPayload)
        const createdId = typeof created === 'object' ? created?.id : created
        if (!createdId) throw new Error('Máy chủ chưa trả về mã sự kiện vừa tạo.')
        eventId = String(createdId)
        setSavedEventId(eventId)
        persistedStatus.current = 'DRAFT'
      }
      const targetStatus = isPublished ? 'PUBLISHED' : 'DRAFT'
      if (persistedStatus.current !== targetStatus) {
        publishing = true
        await fanpageAdminService.changeEventStatus(eventId, targetStatus)
        persistedStatus.current = targetStatus
      }
      onSaveEvent({ ...eventPayload, id: eventId, status: targetStatus }, isPublished)
    } catch (error) {
      const result = eventApiErrors(error)
      setServerErrors(result.fields)
      if (!Object.keys(result.fields).length) {
        setSubmitError(
          publishing
            ? `Đã lưu sự kiện nhưng chưa ${isPublished ? 'xuất bản' : 'chuyển về bản nháp'} được. ${result.message}`
            : result.message
        )
      }
      setSubmitAttempt((current) => current + 1)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      ref={formRef}
      className="w-full flex flex-col gap-6 text-left animate-in fade-in duration-200 [&_[aria-invalid=true]]:border-destructive"
    >
      {/* 1. Header & Actions Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <button
              type="button"
              onClick={onBack}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Quản trị fanpage
            </button>
            <span>/</span>
            <button
              type="button"
              onClick={onBack}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Sự kiện
            </button>
            <span>/</span>
            <span className="text-primary font-bold">
              {isEditMode ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'}
            </span>
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <button
              type="button"
              onClick={onBack}
              className="p-1 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors sm:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="font-k2d font-bold text-2xl text-foreground">
              {isEditMode ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isEditMode
              ? `Cập nhật thông tin chi tiết và quyền lợi sinh viên tham gia sự kiện (${initialEvent?.name}).`
              : 'Thiết lập đầy đủ thông tin tổ chức, thời gian đăng ký và quyền lợi rèn luyện cho sinh viên.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onBack}
            disabled={isSubmitting || isUploadingImage}
            className="h-9 px-4 text-xs font-medium cursor-pointer"
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting || isUploadingImage}
            className="h-9 px-4 text-xs font-medium cursor-pointer"
          >
            Lưu bản nháp
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting || isUploadingImage}
            className="h-9 px-4 text-xs font-semibold bg-primary hover:bg-primary/95 text-white flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            {isSubmitting || isUploadingImage ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{isUploadingImage ? 'Đang tải ảnh...' : 'Đang xử lý...'}</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>{isEditMode ? 'Cập nhật sự kiện' : 'Xuất bản sự kiện'}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {submitError && (
        <p
          role="alert"
          data-submit-error
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {submitError}
        </p>
      )}
      {fieldError('fanpageId')}
      {/* 2. Form Fields Container (Lưới 2 cột cân xứng chuẩn AGENTS.md) */}
      <div className="flex flex-col gap-6">
        {/* Section 1: Thông tin cơ bản & Học kỳ áp dụng */}
        <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-card border border-border flex flex-col gap-4 shadow-2xs">
          <div className="border-b border-border pb-3">
            <h3 className="font-semibold text-base text-foreground font-heading">
              1. Thông tin sự kiện & Học kỳ áp dụng
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gắn sự kiện với học kỳ để hệ thống tự động quản lý điểm rèn luyện và xét điều kiện
              tham gia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Tên sự kiện (chiếm 2 cột) */}
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="event-name">
                Tên sự kiện <span className="text-destructive">*</span>
              </Label>
              <Input
                id="event-name"
                {...errorProps('name')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Ngày hội việc làm CNTT 2026..."
              />
              {fieldError('name')}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-academic-year">
                Năm học áp dụng <span className="text-destructive">*</span>
              </Label>
              <Select
                value={academicYearId ? String(academicYearId) : ''}
                onValueChange={(value) => {
                  setAcademicYearId(Number(value))
                  setSemesterId(0)
                  if (initialEvent)
                    restoredYear.current = `${initialEvent.id}:${initialEvent.semesterId}`
                }}
              >
                <SelectTrigger id="event-academic-year" {...errorProps('academicYearId')}>
                  <SelectValue placeholder="Chọn năm học" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={String(year.id)}>
                      {year.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldError('academicYearId')}
            </div>
            {/* Học kỳ áp dụng (Bắt buộc theo CSDL schema.sql) */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-semester">
                Học kỳ áp dụng <span className="text-destructive">*</span>
              </Label>
              <Select
                value={semesterId ? String(semesterId) : ''}
                onValueChange={(val) => setSemesterId(Number(val))}
              >
                <SelectTrigger
                  id="event-semester"
                  disabled={!selectedAcademicYear}
                  {...errorProps('semesterId')}
                >
                  <SelectValue
                    placeholder={
                      selectedAcademicYear ? 'Chọn học kỳ áp dụng' : 'Chọn năm học trước'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableSemesters.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {`Học kỳ ${s.number}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldError('semesterId')}
            </div>

            {/* Loại sự kiện (Combobox có tìm kiếm & đồng bộ CSDL thật) */}
            <div
              className="md:col-span-2 flex flex-col gap-1.5 relative"
              ref={eventTypeComboboxRef}
            >
              <Label htmlFor="event-type">
                Loại sự kiện <span className="text-destructive">*</span>
              </Label>
              <button
                type="button"
                id="event-type"
                {...errorProps('eventTypeId')}
                onClick={() => setIsEventTypeOpen((prev) => !prev)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground flex items-center justify-between gap-2 hover:bg-accent/40 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all cursor-pointer text-left"
              >
                <span
                  className={
                    selectedEventTypeObj ? 'font-medium truncate' : 'text-muted-foreground truncate'
                  }
                >
                  {selectedEventTypeObj ? selectedEventTypeObj.name : 'Chọn loại sự kiện'}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                    isEventTypeOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {fieldError('eventTypeId')}

              {isEventTypeOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-popover border border-border rounded-xl shadow-xl z-50 max-h-60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-2 border-b border-border bg-muted/40 flex items-center gap-2">
                    <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <input
                      type="text"
                      value={eventTypeSearch}
                      onChange={(e) => setEventTypeSearch(e.target.value)}
                      placeholder="Tìm kiếm loại sự kiện..."
                      className="w-full text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                      autoFocus
                    />
                  </div>
                  <div className="overflow-y-auto p-1 flex-1 max-h-48 divide-y divide-border/20">
                    {filteredEventTypes.length === 0 ? (
                      <div className="py-4 text-center text-xs text-muted-foreground">
                        Không tìm thấy loại sự kiện phù hợp
                      </div>
                    ) : (
                      filteredEventTypes.map((t) => {
                        const isSelected = eventTypeId === t.id
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setEventTypeId(t.id)
                              setIsEventTypeOpen(false)
                              setEventTypeSearch('')
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                              isSelected
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'hover:bg-accent hover:text-accent-foreground text-foreground'
                            }`}
                          >
                            <span className="truncate">{t.name}</span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Đơn vị tổ chức (Disabled) */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-organizer">Đơn vị tổ chức</Label>
              <Input
                id="event-organizer"
                disabled
                value={currentFanpage.name}
                className="bg-muted/50 cursor-not-allowed"
              />
            </div>

            {/* Hình thức tổ chức */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-format">Hình thức tổ chức</Label>
              <Select
                value={format}
                onValueChange={(val: 'OFFLINE' | 'ONLINE' | 'HYBRID') => setFormat(val)}
              >
                <SelectTrigger id="event-format" {...errorProps('format')}>
                  <SelectValue placeholder="Chọn hình thức" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OFFLINE">Tại địa điểm (Trực tiếp)</SelectItem>
                  <SelectItem value="ONLINE">Trực tuyến</SelectItem>
                  <SelectItem value="HYBRID">Kết hợp trực tiếp & trực tuyến</SelectItem>
                </SelectContent>
              </Select>
              {fieldError('format')}
            </div>

            {/* Địa điểm tổ chức (chiếm 2 cột) */}
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="event-location">
                Địa điểm tổ chức <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="event-location"
                  {...errorProps('location')}
                  className="pl-9"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ví dụ: Hội trường Rùa, Khu II, Đại học Cần Thơ..."
                />
              </div>
              {fieldError('location')}
            </div>
          </div>
        </div>

        {/* Section 2: Thời gian tổ chức & Thời gian mở/đóng đăng ký */}
        <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-card border border-border flex flex-col gap-5 shadow-2xs">
          <div className="border-b border-border pb-3">
            <h3 className="font-semibold text-base text-foreground font-heading">
              2. Thời gian tổ chức & Cổng đăng ký
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Xác định ngày diễn ra sự kiện và khoảng thời gian cho phép sinh viên đăng ký trên ứng
              dụng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="date-happen">
                Ngày diễn ra sự kiện <span className="text-destructive">*</span>
              </Label>
              <DatePicker
                id="date-happen"
                value={dateHappen}
                onChange={setDateHappen}
                placeholder="Chọn ngày diễn ra..."
                {...errorProps('dateHappen')}
              />
              {fieldError('dateHappen')}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>
                Khung giờ diễn ra (Bắt đầu - Kết thúc) <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1.5">
                  <TimeSelect
                    id="event-time-start"
                    value={timeStart}
                    onChange={setTimeStart}
                    placeholder="Giờ bắt đầu"
                    {...errorProps('timeStart')}
                  />
                  {fieldError('timeStart')}
                </div>
                <div className="flex flex-col gap-1.5">
                  <TimeSelect
                    id="event-time-end"
                    value={timeEnd}
                    onChange={setTimeEnd}
                    placeholder="Giờ kết thúc"
                    {...errorProps('timeEnd')}
                  />
                  {fieldError('timeEnd')}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="registration-open-date">
                  Mở cổng đăng ký <span className="text-destructive">*</span>
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-primary"
                  onClick={() => {
                    const now = new Date().toISOString()
                    setDateOpen(parseIsoToLocalDate(now))
                    setTimeOpen(parseIsoToLocalTime(now))
                  }}
                >
                  Thời gian hiện tại
                </Button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                <div className="col-span-3">
                  <DatePicker
                    id="registration-open-date"
                    value={dateOpen}
                    onChange={setDateOpen}
                    placeholder="Ngày mở cổng..."
                    {...errorProps('dateOpen')}
                  />
                </div>
                <div className="col-span-2">
                  <TimeSelect
                    id="registration-open-time"
                    value={timeOpen}
                    onChange={setTimeOpen}
                    placeholder="Giờ mở"
                    {...errorProps('dateOpen')}
                  />
                </div>
              </div>
              {fieldError('dateOpen')}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="registration-close-date" className="flex h-8 items-center gap-1">
                Đóng cổng đăng ký <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-5 gap-2">
                <div className="col-span-3">
                  <DatePicker
                    id="registration-close-date"
                    value={dateClose}
                    onChange={setDateClose}
                    minDate={minCloseDate}
                    maxDate={dateHappen || undefined}
                    placeholder="Ngày đóng cổng..."
                    {...errorProps('dateClose')}
                  />
                </div>
                <div className="col-span-2">
                  <TimeSelect
                    id="registration-close-time"
                    value={timeClose}
                    onChange={setTimeClose}
                    minTime={minCloseTime}
                    maxTime={dateClose === dateHappen ? timeStart : undefined}
                    placeholder="Giờ đóng"
                    {...errorProps('dateClose')}
                  />
                </div>
              </div>
              {fieldError('dateClose')}
            </div>

            {/* Nhóm 3: Sức chứa & Tùy chọn số lượng Nam / Nữ */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-capacity">
                Số lượng sinh viên tham gia <span className="text-destructive">*</span>
              </Label>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground font-medium">Tổng:</span>
                    <Input
                      id="event-capacity"
                      {...errorProps('capacity')}
                      type="number"
                      min={1}
                      value={capacity}
                      onChange={(e) => setCapacity(Math.max(1, Number(e.target.value)))}
                      placeholder="300"
                      className="w-24 text-center font-bold text-foreground"
                    />
                  </div>
                  {fieldError('capacity')}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground font-medium">Nam:</span>
                    <Input
                      id="male-quantity"
                      {...errorProps('maleQuantity')}
                      type="number"
                      min={0}
                      value={maleQuantity}
                      onChange={(e) =>
                        setMaleQuantity(
                          e.target.value === '' ? '' : Math.max(0, Number(e.target.value))
                        )
                      }
                      placeholder="Tùy chọn"
                      className="w-24 text-center text-xs"
                    />
                  </div>
                  {fieldError('maleQuantity')}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground font-medium">Nữ:</span>
                    <Input
                      id="female-quantity"
                      {...errorProps('femaleQuantity')}
                      type="number"
                      min={0}
                      value={femaleQuantity}
                      onChange={(e) =>
                        setFemaleQuantity(
                          e.target.value === '' ? '' : Math.max(0, Number(e.target.value))
                        )
                      }
                      placeholder="Tùy chọn"
                      className="w-24 text-center text-xs"
                    />
                  </div>
                  {fieldError('femaleQuantity')}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Để trống Nam/Nữ nếu không phân bổ giới hạn theo giới tính.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Cấu hình hình thức điểm danh */}
        <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-card border border-border flex flex-col gap-4 shadow-2xs">
          <div className="border-b border-border pb-3">
            <h3 className="font-semibold text-base text-foreground font-heading">
              3. Cấu hình điểm danh sự kiện
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Lựa chọn phương thức xác thực và các phiên điểm danh áp dụng tại sự kiện.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Phương thức điểm danh */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="attendance-method">
                Phương thức điểm danh <span className="text-destructive">*</span>
              </Label>
              <Select
                value={attendanceMethod}
                onValueChange={(val: 'MANUAL' | 'STUDENT_PROOF') => setAttendanceMethod(val)}
              >
                <SelectTrigger id="attendance-method" {...errorProps('attendanceMethod')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANUAL">Ban tổ chức điểm danh trực tiếp</SelectItem>
                  <SelectItem value="STUDENT_PROOF">
                    Sinh viên tự điểm danh (có thể gửi ảnh)
                  </SelectItem>
                </SelectContent>
              </Select>
              {fieldError('attendanceMethod')}
            </div>

            {/* Phiên điểm danh bắt buộc */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="session-type">
                Phiên điểm danh bắt buộc <span className="text-destructive">*</span>
              </Label>
              <Select
                value={attendanceSessionType}
                onValueChange={(val: 'START' | 'END' | 'BOTH') => setAttendanceSessionType(val)}
              >
                <SelectTrigger id="session-type" {...errorProps('attendanceSessionType')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOTH">Cả hai phiên (Đầu giờ & Cuối giờ)</SelectItem>
                  <SelectItem value="START">Chỉ điểm danh đầu giờ</SelectItem>
                  <SelectItem value="END">Chỉ điểm danh cuối giờ</SelectItem>
                </SelectContent>
              </Select>
              {fieldError('attendanceSessionType')}
            </div>
          </div>
        </div>

        {/* Section 4: Quyền lợi rèn luyện & Tiêu chí SV5T (Cascading Multi-Level) */}
        <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-card border border-border flex flex-col gap-5 shadow-2xs">
          <div className="border-b border-border pb-3">
            <h3 className="font-semibold text-base text-foreground font-heading">
              4. Quyền lợi rèn luyện & Tiêu chí SV5T
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Lựa chọn danh mục điểm rèn luyện phân cấp nhiều tầng và tiêu chí Sinh viên 5 Tốt tương
              ứng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-4">
              <div className="border-b border-border/60 pb-2">
                <h4 className="text-sm font-semibold text-foreground">Điểm rèn luyện</h4>
              </div>
              {fieldError('eventPoints')}
              <div className="flex flex-col gap-3">
                {selectedPointCategories.map((item) => (
                  <div
                    key={item.pointCategoryId}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border bg-brand-subtle p-3"
                  >
                    <div className="flex min-w-0 flex-col gap-1">
                      <p className="text-xs font-medium text-primary">
                        {item.pointCategoryCode && `${item.pointCategoryCode} · `}+{item.point} điểm
                        rèn luyện
                      </p>
                      <p className="text-sm text-foreground">{item.pointCategoryName}</p>
                      {item.maximum != null && (
                        <p className="text-xs text-muted-foreground">Tối đa {item.maximum} điểm</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Bỏ chọn ${item.pointCategoryName}`}
                      onClick={() =>
                        setSelectedPointCategories((current) =>
                          current.filter(
                            (category) => category.pointCategoryId !== item.pointCategoryId
                          )
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 justify-start gap-2"
                  onClick={() => setIsPointModalOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  {selectedPointCategories.length
                    ? 'Thay đổi / Chọn thêm mục ĐRL'
                    : 'Chọn mục điểm rèn luyện'}
                </Button>
                {selectedPointCategories.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Tổng điểm cộng:{' '}
                    <span className="font-medium text-primary">+{totalTrainingPoints} ĐRL</span>
                  </p>
                )}
              </div>
            </div>

            {/* Cột phải: Tiêu chí SV5T & Giấy chứng nhận */}
            <div className="flex flex-col gap-4">
              <div className="border-b border-border/60 pb-2">
                <h4 className="text-sm font-semibold text-foreground">
                  Tiêu chí SV5T & Chứng nhận
                </h4>
              </div>

              {fieldError('criteriaIds')}
              {/* Tiêu chí Sinh viên 5 Tốt (Mở bảng danh mục giống Điểm rèn luyện) */}
              <div className="flex flex-col gap-3">
                {selectedSv5tCriteria.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border bg-brand-subtle p-3"
                  >
                    <div className="flex min-w-0 flex-col gap-1">
                      <p className="text-xs font-medium text-primary">
                        {SCOPE_LABELS[item.scope || ''] || item.scope} · {item.standardName}
                      </p>
                      <p className="text-sm text-foreground">
                        {item.code && `${item.code}. `}
                        {item.name}
                      </p>
                      {(item.requiredOccurrences || 1) > 1 && (
                        <p className="text-xs text-muted-foreground">
                          Ghi nhận 1 lần/sự kiện · Đủ {item.requiredOccurrences} lần trong năm học
                          mới đạt
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Bỏ chọn ${item.name}`}
                      onClick={() =>
                        setSelectedSv5tCriteria((current) =>
                          current.filter((criterion) => criterion.id !== item.id)
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 justify-start gap-2"
                  onClick={() => setIsSv5tModalOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  {selectedSv5tCriteria.length
                    ? 'Thay đổi / Chọn thêm tiêu chí'
                    : 'Chọn tiêu chí Sinh viên 5 tốt'}
                </Button>
              </div>

              {/* Cấp Giấy chứng nhận E-Certificate */}
              <div className="pt-2 flex flex-col gap-1.5">
                <Label htmlFor="certificate-option">Giấy chứng nhận tham gia</Label>
                <Select
                  value={hasCertificate ? 'YES' : 'NO'}
                  onValueChange={(val) => setHasCertificate(val === 'YES')}
                >
                  <SelectTrigger
                    id="certificate-option"
                    {...errorProps('hasCertificate')}
                    className="text-left text-xs"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YES" className="text-xs">
                      Có cấp giấy chứng nhận tham gia
                    </SelectItem>
                    <SelectItem value="NO" className="text-xs">
                      Không cấp giấy chứng nhận (Chỉ ghi nhận CSDL rèn luyện)
                    </SelectItem>
                  </SelectContent>
                </Select>
                {fieldError('hasCertificate')}
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Ảnh bìa sự kiện (Poster 16:9) & Nội dung chi tiết */}
        <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-card border border-border flex flex-col gap-4 shadow-2xs">
          <div className="border-b border-border pb-3">
            <h3 className="font-semibold text-base text-foreground font-heading">
              5. Ảnh bìa Poster sự kiện & Nội dung chi tiết
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tải lên hình ảnh poster thực tế và trình bày mục tiêu, diễn giả, lịch trình chi tiết.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            {/* Cột trái: Ảnh bìa Poster sự kiện (Tỷ lệ 16:9) */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between h-5">
                <Label>
                  Ảnh bìa Poster sự kiện (Tỷ lệ 16:9) <span className="text-destructive">*</span>
                </Label>
              </div>

              {fieldError('bannerUrl')}
              {/* Khung Live Preview 16:9 vừa vặn toàn bộ cột */}
              <div className="w-full aspect-video rounded-xl overflow-hidden border border-border bg-muted relative shadow-2xs group">
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white z-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-xs font-semibold">Đang tải ảnh lên Cloudinary...</span>
                  </div>
                )}
                {bannerPreview ? (
                  <img
                    src={bannerPreview}
                    alt="Banner Preview"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ImageIcon className="h-10 w-10 opacity-40" />
                    <span className="text-xs">Chưa có ảnh bìa poster</span>
                  </div>
                )}
              </div>

              {/* Upload controls */}
              <div className="flex flex-col gap-2 pt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isSubmitting || isUploadingImage}
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    {...errorProps('bannerUrl')}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting || isUploadingImage}
                    className="h-9 px-3.5 text-xs font-semibold gap-1.5 cursor-pointer flex-1"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Tải ảnh từ thiết bị</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleUseSampleImage}
                    disabled={isSubmitting || isUploadingImage}
                    className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Dùng ảnh mẫu</span>
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Định dạng hỗ trợ: PNG, JPG, WEBP. Kích thước khuyến nghị: 1200 × 675 px.
                </p>
              </div>
            </div>

            {/* Cột phải: Nội dung chi tiết & Từ khóa tìm kiếm */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between h-5">
                <Label htmlFor="event-description">
                  Nội dung chi tiết <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsExpandedDesc(!isExpandedDesc)}
                    className="text-[11px] font-medium text-primary hover:underline cursor-pointer flex items-center gap-1"
                  >
                    {isExpandedDesc ? 'Thu nhỏ khung' : 'Mở rộng khung nhập'}
                  </button>
                  <span className="text-[11px] text-muted-foreground">
                    {description.length} ký tự
                  </span>
                </div>
              </div>

              <Textarea
                id="event-description"
                {...errorProps('description')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập nội dung, lộ trình, diễn giả và quyền lợi cụ thể của sự kiện... (Hỗ trợ định dạng xuống dòng, dán bài viết dài)"
                className={cn(
                  'leading-relaxed font-sans text-sm resize-y whitespace-pre-wrap transition-all shadow-2xs',
                  isExpandedDesc ? 'min-h-[420px]' : 'min-h-[220px]'
                )}
              />
              {fieldError('description')}
              <p className="text-[11px] text-muted-foreground">
                Gợi ý: Bạn có thể kéo góc dưới bên phải để chỉnh chiều cao tùy ý. Các đoạn xuống
                dòng được bảo toàn nguyên vẹn khi hiển thị lên bài đăng.
              </p>

              {/* Từ khóa tìm kiếm (Tags) */}
              <div className="flex flex-col gap-1.5 pt-2">
                <Label htmlFor="event-tags">Từ khóa tìm kiếm (Tags)</Label>
                <Input
                  id="event-tags"
                  {...errorProps('tags')}
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Phân tách bởi dấu phẩy, ví dụ: việc làm, thực tập, công nghệ thông tin..."
                />
                {fieldError('tags')}
                <p className="text-[11px] text-muted-foreground">
                  Gắn từ khóa giúp sinh viên dễ dàng tìm kiếm sự kiện theo chủ đề quan tâm.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Action Bar */}
      <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onBack}
          disabled={isSubmitting || isUploadingImage}
          className="h-9 px-4 text-xs font-medium cursor-pointer"
        >
          Hủy bỏ
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleSubmit(false)}
          disabled={isSubmitting || isUploadingImage}
          className="h-9 px-4 text-xs font-medium cursor-pointer"
        >
          Lưu bản nháp
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => handleSubmit(true)}
          disabled={isSubmitting || isUploadingImage}
          className="h-9 px-4 text-xs font-semibold bg-primary hover:bg-primary/95 text-white flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          {isSubmitting || isUploadingImage ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{isUploadingImage ? 'Đang tải ảnh...' : 'Đang xử lý...'}</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              <span>{isEditMode ? 'Cập nhật sự kiện' : 'Xuất bản sự kiện'}</span>
            </>
          )}
        </Button>
      </div>

      {/* Modal chọn nhiều mục Điểm rèn luyện */}
      <SelectPointCategoriesModal
        isOpen={isPointModalOpen}
        onClose={() => setIsPointModalOpen(false)}
        onConfirm={(list) => setSelectedPointCategories(list)}
        initialSelected={selectedPointCategories}
        pointCategories={pointCategories}
      />

      {/* Modal chọn Tiêu chuẩn & Tiêu chí Sinh viên 5 Tốt */}
      <SelectSv5tCriteriaModal
        isOpen={isSv5tModalOpen}
        onClose={() => setIsSv5tModalOpen(false)}
        onConfirm={(selected) => setSelectedSv5tCriteria(selected)}
        initialSelected={selectedSv5tCriteria}
        criterias={sv5tCriterias}
      />
    </div>
  )
}
