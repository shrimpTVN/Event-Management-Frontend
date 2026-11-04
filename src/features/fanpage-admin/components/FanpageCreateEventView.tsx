import React, { useState, useRef, useMemo, useEffect } from 'react'
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
  GraduationCap,
} from 'lucide-react'
import { mediaService } from '@/shared'
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
import { SelectPointCategoriesModal, type SelectedPointCategory } from './SelectPointCategoriesModal'
import { SelectSv5tCriteriaModal, type SelectedSv5tCriteria } from './SelectSv5tCriteriaModal'
import type { AdminEvent, FanpageSummary, PointCategoryItem, Sv5tCriteriaItem } from '../types/fanpageAdmin.types'
import {
  MOCK_EVENT_TYPES,
  MOCK_SEMESTERS,
  fanpageAdminService,
} from '../services/fanpageAdminService'

interface FanpageCreateEventViewProps {
  currentFanpage: FanpageSummary
  onBack: () => void
  onSaveEvent: (newEvent: Partial<AdminEvent>, isPublished: boolean) => void
  initialEvent?: AdminEvent | null
}

export const FanpageCreateEventView: React.FC<FanpageCreateEventViewProps> = ({
  currentFanpage,
  onBack,
  onSaveEvent,
  initialEvent,
}) => {
  const isEditMode = Boolean(initialEvent)

  // 1. Thông tin cơ bản & Học kỳ (Schema: name, eventTypeId, semesterId, fanpageId, format, location)
  const [name, setName] = useState(initialEvent?.name || '')
  const [eventTypeId, setEventTypeId] = useState<number>(initialEvent?.eventTypeId || 1)
  const [semesterId, setSemesterId] = useState<number>(initialEvent?.semesterId || 1)
  const [format, setFormat] = useState<'OFFLINE' | 'ONLINE' | 'HYBRID'>(initialEvent?.format || 'OFFLINE')
  const [location, setLocation] = useState(initialEvent?.location || '')

  // 2. Thời gian tổ chức & Thời gian mở/đóng đăng ký (Schema: dateHappen, dateOpen, dateClose)
  const [dateHappen, setDateHappen] = useState(
    initialEvent?.dateStart || (initialEvent?.dateHappen ? initialEvent.dateHappen.split('T')[0] : '')
  )
  const [timeStart, setTimeStart] = useState(initialEvent?.timeStart || '08:00')
  const [timeEnd, setTimeEnd] = useState(initialEvent?.timeEnd || '11:30')
  const [dateOpen, setDateOpen] = useState(
    initialEvent?.dateOpen ? initialEvent.dateOpen.split('T')[0] : ''
  )
  const [timeOpen, setTimeOpen] = useState(
    initialEvent?.dateOpen && initialEvent.dateOpen.includes('T')
      ? initialEvent.dateOpen.split('T')[1].substring(0, 5)
      : '07:00'
  )
  const [dateClose, setDateClose] = useState(
    initialEvent?.dateClose ? initialEvent.dateClose.split('T')[0] : ''
  )
  const [timeClose, setTimeClose] = useState(
    initialEvent?.dateClose && initialEvent.dateClose.includes('T')
      ? initialEvent.dateClose.split('T')[1].substring(0, 5)
      : '23:59'
  )

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
    initialEvent?.attendanceMethod || 'MANUAL'
  )
  const [attendanceSessionType, setAttendanceSessionType] = useState<'START' | 'END' | 'BOTH'>(
    initialEvent?.attendanceSessionType || 'BOTH'
  )

  // 5. Quyền lợi sinh viên - Phân cấp Điểm rèn luyện & Tiêu chí SV5T
  const { data: pointCategories = [] } = useQuery<PointCategoryItem[]>({
    queryKey: ['pointCategories'],
    queryFn: () => fanpageAdminService.getPointCategories(),
  })

  const { data: sv5tCriterias = [] } = useQuery<Sv5tCriteriaItem[]>({
    queryKey: ['sv5tCriterias'],
    queryFn: () => fanpageAdminService.getSv5tCriterias(),
  })

  // Lấy danh sách loại sự kiện thực tế từ Backend API & Combobox state
  const { data: eventTypeList = MOCK_EVENT_TYPES } = useQuery({
    queryKey: ['admin-event-types'],
    queryFn: () => fanpageAdminService.getEventTypes(),
  })
  const [isEventTypeOpen, setIsEventTypeOpen] = useState(false)
  const [eventTypeSearch, setEventTypeSearch] = useState('')
  const eventTypeComboboxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (eventTypeComboboxRef.current && !eventTypeComboboxRef.current.contains(e.target as Node)) {
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
  const [selectedPointCategories, setSelectedPointCategories] = useState<SelectedPointCategory[]>(() => {
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
  })

  const totalTrainingPoints = useMemo(() => {
    return selectedPointCategories.reduce((sum, item) => sum + (item.point || 0), 0)
  }, [selectedPointCategories])



  // Tiêu chuẩn & Tiêu chí Sinh viên 5 Tốt
  const [selectedSv5tCriteria, setSelectedSv5tCriteria] = useState<SelectedSv5tCriteria | null>(null)
  const [isSv5tModalOpen, setIsSv5tModalOpen] = useState(false)
  const [hasCertificate, setHasCertificate] = useState<boolean>(
    initialEvent ? Boolean(initialEvent.hasCertificate) : false
  )

  const activeSv5tId = selectedSv5tCriteria?.id || undefined
  const activeSv5tName = selectedSv5tCriteria?.name || undefined

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

  // Đồng bộ lại toàn bộ Form khi initialEvent thay đổi (chuyển đổi giữa Tạo mới và Chỉnh sửa)
  useEffect(() => {
    if (initialEvent) {
      setName(initialEvent.name || '')
      setEventTypeId(initialEvent.eventTypeId || 1)
      setSemesterId(initialEvent.semesterId || 1)
      setFormat(initialEvent.format || 'OFFLINE')
      setLocation(initialEvent.location || '')
      setDateHappen(
        initialEvent.dateStart || (initialEvent.dateHappen ? initialEvent.dateHappen.split('T')[0] : '')
      )
      setTimeStart(initialEvent.timeStart || '08:00')
      setTimeEnd(initialEvent.timeEnd || '11:30')
      setDateOpen(initialEvent.dateOpen ? initialEvent.dateOpen.split('T')[0] : '')
      setTimeOpen(
        initialEvent.dateOpen && initialEvent.dateOpen.includes('T')
          ? initialEvent.dateOpen.split('T')[1].substring(0, 5)
          : '07:00'
      )
      setDateClose(initialEvent.dateClose ? initialEvent.dateClose.split('T')[0] : '')
      setTimeClose(
        initialEvent.dateClose && initialEvent.dateClose.includes('T')
          ? initialEvent.dateClose.split('T')[1].substring(0, 5)
          : '23:59'
      )
      setCapacity(initialEvent.capacity || '')
      setMaleQuantity(initialEvent.maleQuantity !== undefined ? initialEvent.maleQuantity : '')
      setFemaleQuantity(initialEvent.femaleQuantity !== undefined ? initialEvent.femaleQuantity : '')
      setRequiresApproval(Boolean(initialEvent.requiresApproval))
      setAttendanceMethod(initialEvent.attendanceMethod || 'MANUAL')
      setAttendanceSessionType(initialEvent.attendanceSessionType || 'BOTH')
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
        Array.isArray(initialEvent.tags)
          ? initialEvent.tags.join(', ')
          : initialEvent.tags || ''
      )
      setBannerPreview(initialEvent.bannerUrl || '')
      setBannerFile(null)
    } else {
      // Khởi tạo trạng thái trống khi Tạo sự kiện mới
      setName('')
      setEventTypeId(1)
      setSemesterId(1)
      setFormat('OFFLINE')
      setLocation('')
      setDateHappen('')
      setTimeStart('08:00')
      setTimeEnd('11:30')
      setDateOpen('')
      setTimeOpen('07:00')
      setDateClose('')
      setTimeClose('23:59')
      setCapacity('')
      setMaleQuantity('')
      setFemaleQuantity('')
      setRequiresApproval(false)
      setAttendanceMethod('MANUAL')
      setAttendanceSessionType('BOTH')
      setSelectedPointCategories([])
      setSelectedSv5tCriteria(null)
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
    const critId = initialEvent.sv5tCriteriaId
    if (!critId) {
      setSelectedSv5tCriteria(null)
      return
    }

    const target = sv5tCriterias.find((c) => c.id === critId)
    if (target) {
      setSelectedSv5tCriteria({
        id: target.id,
        name: target.name,
        note: target.note,
      })
    } else if (initialEvent.sv5tCriteriaName) {
      setSelectedSv5tCriteria({
        id: Number(critId),
        name: initialEvent.sv5tCriteriaName,
      })
    }
  }, [initialEvent, sv5tCriterias])

  // Xử lý tải ảnh poster thật từ thiết bị kèm Live Preview trực tiếp
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBannerFile(file)
      const previewUrl = URL.createObjectURL(file)
      setBannerPreview(previewUrl)
    }
  }

  // Chọn ảnh mẫu có sẵn
  const handleUseSampleImage = () => {
    setBannerFile(null)
    setBannerPreview(
      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80'
    )
  }

  // Xử lý submit form
  const handleSubmit = async (isPublished: boolean) => {
    if (!name.trim()) {
      alert('Vui lòng nhập tên sự kiện!')
      return
    }
    if (!location.trim()) {
      alert('Vui lòng nhập địa điểm tổ chức sự kiện!')
      return
    }
    if (!dateHappen) {
      alert('Vui lòng chọn ngày diễn ra sự kiện!')
      return
    }
    if (!capacity || Number(capacity) <= 0) {
      alert('Vui lòng nhập số lượng sinh viên tham gia hợp lệ!')
      return
    }
    if (!bannerPreview && !bannerFile) {
      alert('Vui lòng tải lên ảnh bìa (poster) cho sự kiện!')
      return
    }

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
        alert(uploadErr?.message || 'Không thể tải ảnh poster lên Cloudinary. Vui lòng thử lại!')
        setIsSubmitting(false)
        setIsUploadingImage(false)
        return
      } finally {
        setIsUploadingImage(false)
      }
    }

    const activeSv5tId = activeSv5tCriteria?.id
    const activeSv5tName = activeSv5tCriteria?.name
    const selectedEventType = selectedEventTypeObj || MOCK_EVENT_TYPES.find((t) => t.id === eventTypeId)
    const selectedSemester = MOCK_SEMESTERS.find((s) => s.id === semesterId)

    // Backend LocalDate yêu cầu định dạng YYYY-MM-DD
    const todayStr = new Date().toISOString().split('T')[0]
    const effectiveDateOpen = dateOpen ? dateOpen : (dateHappen < todayStr ? dateHappen : todayStr)
    const effectiveDateClose = dateClose ? dateClose : dateHappen

    const dateOpenIso = `${effectiveDateOpen}T${timeOpen || '07:00'}:00Z`
    const dateCloseIso = `${effectiveDateClose}T${timeClose || '23:59'}:00Z`

    const safeCapacity = Number(capacity) || 0
    const safeMaleQuantity = maleQuantity !== '' && maleQuantity !== undefined ? Number(maleQuantity) : 0
    const safeFemaleQuantity = femaleQuantity !== '' && femaleQuantity !== undefined ? Number(femaleQuantity) : 0

    const eventPayload: Partial<AdminEvent> = {
      id: initialEvent ? initialEvent.id : `evt-${Date.now()}`,
      code: initialEvent ? initialEvent.code : `EVT-${Math.floor(1000 + Math.random() * 9000)}`,
      name,
      description,
      eventTypeId,
      eventTypeName: selectedEventType?.name || 'Học thuật · Công nghệ',
      semesterId,
      semesterName: selectedSemester?.name,
      fanpageId: currentFanpage?.id || '1',
      organizerName: currentFanpage?.name || 'Đoàn Trường CNTT & TT',
      dateStart: dateHappen,
      dateEnd: dateHappen,
      timeStart,
      timeEnd,
      dateOpen: dateOpenIso,
      dateClose: dateCloseIso,
      format,
      location,
      capacity: safeCapacity,
      maleQuantity: safeMaleQuantity,
      femaleQuantity: safeFemaleQuantity,
      registeredCount: initialEvent ? initialEvent.registeredCount : 0,
      checkedInCount: initialEvent ? initialEvent.checkedInCount : 0,
      status: isPublished ? 'PUBLISHED' : (initialEvent ? initialEvent.status : 'DRAFT'),
      bannerUrl: finalBannerUrl,
      requiresApproval,
      attendanceMethod,
      attendanceSessionType,
      autoEmail: true,
      isPublic: true,
      trainingPointCategoryId: selectedPointCategories[0]?.pointCategoryId,
      trainingPointCategoryName: selectedPointCategories.map((c) => c.pointCategoryName).join('; '),
      trainingPointCategoryCode: selectedPointCategories.map((c) => c.pointCategoryCode).filter(Boolean).join(', '),
      trainingPoints: totalTrainingPoints,
      eventPoints: selectedPointCategories,
      sv5tCriteriaId: activeSv5tId,
      sv5tCriteriaName: activeSv5tName,
      hasCertificate,
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      createdAt: initialEvent ? initialEvent.createdAt : new Date().toISOString(),
    }

    try {
      if (initialEvent) {
        await fanpageAdminService.updateAdminEvent(initialEvent.id, {
          name: eventPayload.name,
          description: eventPayload.description,
          location: eventPayload.location,
          dateHappen: dateHappen,
          dateOpen: effectiveDateOpen,
          dateClose: effectiveDateClose,
          capacity: safeCapacity,
          maleQuantity: safeMaleQuantity,
          femaleQuantity: safeFemaleQuantity,
          bannerUrl: finalBannerUrl,
          status: eventPayload.status,
          eventTypeId: eventPayload.eventTypeId,
          semesterId: eventPayload.semesterId,
          criteriaId: eventPayload.sv5tCriteriaId,
          eventPoints: selectedPointCategories.map((c) => ({ pointCategoryId: c.pointCategoryId, point: c.point })),
        } as any)

        // Cập nhật trạng thái sự kiện nếu thay đổi
        const targetStatus = isPublished ? 'PUBLISHED' : 'DRAFT'
        if (initialEvent.status !== targetStatus) {
          try {
            await fanpageAdminService.changeEventStatus(initialEvent.id, targetStatus)
          } catch (stErr) {
            console.warn('Lỗi cập nhật trạng thái sự kiện:', stErr)
          }
        }
      } else {
        await fanpageAdminService.createAdminEvent({
          name: eventPayload.name,
          description: eventPayload.description,
          location: eventPayload.location,
          dateHappen: dateHappen,
          dateOpen: effectiveDateOpen,
          dateClose: effectiveDateClose,
          capacity: safeCapacity,
          maleQuantity: safeMaleQuantity,
          femaleQuantity: safeFemaleQuantity,
          bannerUrl: finalBannerUrl,
          status: eventPayload.status,
          eventTypeId: eventPayload.eventTypeId,
          fanpageId: Number(currentFanpage?.id || 1),
          semesterId: eventPayload.semesterId,
          criteriaId: eventPayload.sv5tCriteriaId,
          eventPoints: selectedPointCategories.map((c) => ({ pointCategoryId: c.pointCategoryId, point: c.point })),
        } as any)

        // Backend Spring Boot mặc định luôn khởi tạo sự kiện mới với status DRAFT (Bản nháp).
        // Nếu người dùng chọn "Xuất bản sự kiện" (isPublished === true), tự động kích hoạt trạng thái PUBLISHED ngay
        if (isPublished) {
          try {
            const latestEvents = await fanpageAdminService.getAdminEvents(currentFanpage?.id || '1')
            if (latestEvents.length > 0 && latestEvents[0]?.id) {
              await fanpageAdminService.changeEventStatus(latestEvents[0].id, 'PUBLISHED')
              eventPayload.status = 'PUBLISHED'
            }
          } catch (pubErr) {
            console.warn('Không thể tự động xuất bản sự kiện mới:', pubErr)
          }
        }
      }
      setIsSubmitting(false)
      onSaveEvent(eventPayload, isPublished)
    } catch (err: any) {
      console.error('API error during event save', err)
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi lưu sự kiện!'
      alert(`Lưu sự kiện thất bại: ${msg}`)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full space-y-6 text-left animate-in fade-in duration-200">
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
            <span className="text-primary font-bold">{isEditMode ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'}</span>
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

      {/* 2. Form Fields Container (Lưới 2 cột cân xứng chuẩn AGENTS.md) */}
      <div className="space-y-6">
        {/* Section 1: Thông tin cơ bản & Học kỳ áp dụng */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-card border border-border space-y-4 shadow-2xs">
          <div className="border-b border-border pb-3">
            <h3 className="font-semibold text-base text-foreground font-heading">
              1. Thông tin sự kiện & Học kỳ áp dụng
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gắn sự kiện với học kỳ để hệ thống tự động quản lý điểm rèn luyện và xét điều kiện tham gia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Tên sự kiện (chiếm 2 cột) */}
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="event-name">
                Tên sự kiện <span className="text-destructive">*</span>
              </Label>
              <Input
                id="event-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Ngày hội việc làm CNTT 2026..."
              />
            </div>

            {/* Học kỳ áp dụng (Bắt buộc theo CSDL schema.sql) */}
            <div className="space-y-1.5">
              <Label htmlFor="event-semester">
                Học kỳ áp dụng <span className="text-destructive">*</span>
              </Label>
              <Select
                value={String(semesterId)}
                onValueChange={(val) => setSemesterId(Number(val))}
              >
                <SelectTrigger id="event-semester">
                  <SelectValue placeholder="Chọn học kỳ áp dụng" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_SEMESTERS.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Loại sự kiện (Combobox có tìm kiếm & đồng bộ CSDL thật) */}
            <div className="space-y-1.5 relative" ref={eventTypeComboboxRef}>
              <Label htmlFor="event-type">
                Loại sự kiện <span className="text-destructive">*</span>
              </Label>
              <button
                type="button"
                id="event-type"
                onClick={() => setIsEventTypeOpen((prev) => !prev)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground flex items-center justify-between gap-2 hover:bg-accent/40 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all cursor-pointer text-left"
              >
                <span className={selectedEventTypeObj ? 'font-medium truncate' : 'text-muted-foreground truncate'}>
                  {selectedEventTypeObj ? selectedEventTypeObj.name : 'Chọn loại sự kiện'}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                    isEventTypeOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

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
            <div className="space-y-1.5">
              <Label htmlFor="event-organizer">Đơn vị tổ chức</Label>
              <Input
                id="event-organizer"
                disabled
                value={currentFanpage.name}
                className="bg-muted/50 cursor-not-allowed"
              />
            </div>

            {/* Hình thức tổ chức */}
            <div className="space-y-1.5">
              <Label htmlFor="event-format">Hình thức tổ chức</Label>
              <Select
                value={format}
                onValueChange={(val: 'OFFLINE' | 'ONLINE' | 'HYBRID') => setFormat(val)}
              >
                <SelectTrigger id="event-format">
                  <SelectValue placeholder="Chọn hình thức" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OFFLINE">Tại địa điểm (Trực tiếp)</SelectItem>
                  <SelectItem value="ONLINE">Trực tuyến</SelectItem>
                  <SelectItem value="HYBRID">Kết hợp trực tiếp & trực tuyến</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Địa điểm tổ chức (chiếm 2 cột) */}
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="event-location">
                Địa điểm tổ chức <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="event-location"
                  className="pl-9"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ví dụ: Hội trường Rùa, Khu II, Đại học Cần Thơ..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Thời gian tổ chức & Thời gian mở/đóng đăng ký */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-card border border-border space-y-5 shadow-2xs">
          <div className="border-b border-border pb-3">
            <h3 className="font-semibold text-base text-foreground font-heading">
              2. Thời gian tổ chức & Cổng đăng ký
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Xác định ngày diễn ra sự kiện và khoảng thời gian cho phép sinh viên đăng ký trên ứng dụng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Nhóm 1: Ngày diễn ra sự kiện */}
            <div className="space-y-1.5">
              <Label htmlFor="date-happen">
                Ngày diễn ra sự kiện <span className="text-destructive">*</span>
              </Label>
              <DatePicker
                id="date-happen"
                value={dateHappen}
                onChange={setDateHappen}
                placeholder="Chọn ngày diễn ra..."
              />
            </div>

            {/* Nhóm 1: Khung giờ diễn ra */}
            <div className="space-y-1.5">
              <Label>
                Khung giờ diễn ra (Bắt đầu - Kết thúc) <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <TimeSelect
                  value={timeStart}
                  onChange={setTimeStart}
                  placeholder="Giờ bắt đầu"
                />
                <TimeSelect
                  value={timeEnd}
                  onChange={setTimeEnd}
                  placeholder="Giờ kết thúc"
                />
              </div>
            </div>

            {/* Nhóm 2: Mở cổng đăng ký (dateOpen + timeOpen) */}
            <div className="space-y-1.5">
              <Label>
                Mở cổng đăng ký <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-5 gap-2">
                <div className="col-span-3">
                  <DatePicker
                    value={dateOpen}
                    onChange={setDateOpen}
                    placeholder="Ngày mở cổng..."
                  />
                </div>
                <div className="col-span-2">
                  <TimeSelect
                    value={timeOpen}
                    onChange={setTimeOpen}
                    placeholder="Giờ mở"
                  />
                </div>
              </div>
            </div>

            {/* Nhóm 2: Đóng cổng đăng ký (dateClose + timeClose) */}
            <div className="space-y-1.5">
              <Label>
                Đóng cổng đăng ký <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-5 gap-2">
                <div className="col-span-3">
                  <DatePicker
                    value={dateClose}
                    onChange={setDateClose}
                    placeholder="Ngày đóng cổng..."
                  />
                </div>
                <div className="col-span-2">
                  <TimeSelect
                    value={timeClose}
                    onChange={setTimeClose}
                    placeholder="Giờ đóng"
                  />
                </div>
              </div>
            </div>

            {/* Nhóm 3: Sức chứa & Tùy chọn số lượng Nam / Nữ */}
            <div className="space-y-1.5">
              <Label htmlFor="event-capacity">
                Số lượng sinh viên tham gia <span className="text-destructive">*</span>
              </Label>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground font-medium">Tổng:</span>
                  <Input
                    id="event-capacity"
                    type="number"
                    min={1}
                    value={capacity}
                    onChange={(e) => setCapacity(Math.max(1, Number(e.target.value)))}
                    placeholder="300"
                    className="w-24 text-center font-bold text-foreground"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground font-medium">Nam:</span>
                  <Input
                    id="male-quantity"
                    type="number"
                    min={0}
                    value={maleQuantity}
                    onChange={(e) =>
                      setMaleQuantity(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))
                    }
                    placeholder="Tùy chọn"
                    className="w-24 text-center text-xs"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground font-medium">Nữ:</span>
                  <Input
                    id="female-quantity"
                    type="number"
                    min={0}
                    value={femaleQuantity}
                    onChange={(e) =>
                      setFemaleQuantity(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))
                    }
                    placeholder="Tùy chọn"
                    className="w-24 text-center text-xs"
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Để trống Nam/Nữ nếu không phân bổ giới hạn theo giới tính.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Cấu hình hình thức điểm danh */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-card border border-border space-y-4 shadow-2xs">
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
            <div className="space-y-1.5">
              <Label htmlFor="attendance-method">
                Phương thức điểm danh <span className="text-destructive">*</span>
              </Label>
              <Select
                value={attendanceMethod}
                onValueChange={(val: 'MANUAL' | 'STUDENT_PROOF') => setAttendanceMethod(val)}
              >
                <SelectTrigger id="attendance-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANUAL">
                    Ban tổ chức điểm danh trực tiếp
                  </SelectItem>
                  <SelectItem value="STUDENT_PROOF">
                    Sinh viên tự nộp ảnh minh chứng (chờ BTC duyệt)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Phiên điểm danh bắt buộc */}
            <div className="space-y-1.5">
              <Label htmlFor="session-type">
                Phiên điểm danh bắt buộc <span className="text-destructive">*</span>
              </Label>
              <Select
                value={attendanceSessionType}
                onValueChange={(val: 'START' | 'END' | 'BOTH') => setAttendanceSessionType(val)}
              >
                <SelectTrigger id="session-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOTH">Cả hai phiên (Đầu giờ & Cuối giờ)</SelectItem>
                  <SelectItem value="START">Chỉ điểm danh đầu giờ</SelectItem>
                  <SelectItem value="END">Chỉ điểm danh cuối giờ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Section 4: Quyền lợi rèn luyện & Tiêu chí SV5T (Cascading Multi-Level) */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-card border border-border space-y-5 shadow-2xs">
          <div className="border-b border-border pb-3">
            <h3 className="font-semibold text-base text-foreground font-heading">
              4. Quyền lợi rèn luyện & Tiêu chí SV5T
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Lựa chọn danh mục điểm rèn luyện phân cấp nhiều tầng và tiêu chí Sinh viên 5 Tốt tương ứng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cột trái: Phân cấp Điểm rèn luyện dạng Modal Đa Mục */}
            <div className="space-y-4">
              <div className="border-b border-border/60 pb-2 flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Quy định Điểm rèn luyện
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Chọn các mục tiêu chí cộng điểm rèn luyện cho sinh viên.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPointModalOpen(true)}
                  className="h-8 px-2.5 text-xs font-semibold text-primary border-primary/40 hover:bg-primary/10 gap-1.5 cursor-pointer shadow-2xs rounded-lg shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Chọn mục ĐRL</span>
                </Button>
              </div>

              {/* Danh sách mục ĐRL đã chọn */}
              {selectedPointCategories.length === 0 ? (
                <div
                  onClick={() => setIsPointModalOpen(true)}
                  className="p-5 rounded-xl border border-dashed border-border/80 hover:border-primary/50 bg-[#F9FAFB]/50 dark:bg-background/40 text-center cursor-pointer transition-all space-y-1.5 group"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Plus className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    Chưa chọn mục điểm rèn luyện
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Bấm để mở danh sách chọn một hoặc nhiều tiêu chí cộng ĐRL.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="text-muted-foreground font-medium">
                      Đã chọn <strong>{selectedPointCategories.length}</strong> mục
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                    {selectedPointCategories.map((item) => (
                      <div
                        key={item.pointCategoryId}
                        className="p-2.5 rounded-xl border border-border/80 bg-white dark:bg-card shadow-2xs flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            {item.pointCategoryCode && (
                              <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary font-bold text-[10px] shrink-0">
                                {item.pointCategoryCode}
                              </span>
                            )}
                            <p className="text-xs font-semibold text-foreground truncate">
                              {item.pointCategoryName}
                            </p>
                          </div>
                          {item.maximum && (
                            <p className="text-[10px] text-muted-foreground">
                              Tối đa: {item.maximum} điểm
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-bold whitespace-nowrap">
                            +{item.point} ĐRL
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPointCategories((prev) =>
                                prev.filter((p) => p.pointCategoryId !== item.pointCategoryId)
                              )
                            }}
                            className="p-1 text-muted-foreground hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Xóa mục này"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsPointModalOpen(true)}
                      className="w-full h-8 text-xs text-primary font-medium hover:bg-primary/5 cursor-pointer"
                    >
                      Thay đổi / Chọn thêm mục ĐRL
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Cột phải: Tiêu chí SV5T & Giấy chứng nhận */}
            <div className="space-y-4">
              <div className="border-b border-border/60 pb-2">
                <h4 className="text-sm font-semibold text-foreground">
                  Tiêu chí SV5T & Chứng nhận
                </h4>
              </div>

              {/* Tiêu chí Sinh viên 5 Tốt (Mở bảng danh mục giống Điểm rèn luyện) */}
              {!selectedSv5tCriteria ? (
                <div className="p-4 rounded-xl border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center text-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-2xs">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      Chưa chọn tiêu chí Sinh viên 5 Tốt
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Mở bảng danh mục SV5T để chọn đúng mục tiêu chuẩn công nhận quyền lợi cho sinh viên
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSv5tModalOpen(true)}
                    className="mt-1 h-8 text-xs font-semibold cursor-pointer border-primary/40 text-primary hover:bg-primary/5"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Chọn tiêu chí Sinh viên 5 Tốt
                  </Button>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 dark:bg-primary/10 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {selectedSv5tCriteria.code && (
                          <span className="px-2 py-0.5 rounded bg-primary text-white font-bold text-[10px] shrink-0">
                            {selectedSv5tCriteria.code}
                          </span>
                        )}
                        {selectedSv5tCriteria.standardName && (
                          <span className="text-[11px] font-bold text-primary truncate">
                            {selectedSv5tCriteria.standardName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-foreground leading-relaxed">
                        {selectedSv5tCriteria.name}
                      </p>
                      {selectedSv5tCriteria.note && (
                        <p className="text-[11px] text-muted-foreground italic line-clamp-2">
                          {selectedSv5tCriteria.note}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedSv5tCriteria(null)}
                      className="p-1 text-muted-foreground hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                      title="Bỏ chọn tiêu chí này"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="pt-2 border-t border-primary/20 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      Sinh viên được ghi nhận đạt mục này khi hoàn thành
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSv5tModalOpen(true)}
                      className="h-7 text-xs text-primary font-medium hover:bg-primary/10 cursor-pointer"
                    >
                      Thay đổi tiêu chí
                    </Button>
                  </div>
                </div>
              )}

              {/* Cấp Giấy chứng nhận E-Certificate */}
              <div className="pt-2 space-y-1.5">
                <Label htmlFor="certificate-option">Giấy chứng nhận tham gia</Label>
                <Select
                  value={hasCertificate ? 'YES' : 'NO'}
                  onValueChange={(val) => setHasCertificate(val === 'YES')}
                >
                  <SelectTrigger id="certificate-option" className="text-left text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YES" className="text-xs">
                      Có cấp Giấy chứng nhận điện tử (E-Certificate có chữ ký số)
                    </SelectItem>
                    <SelectItem value="NO" className="text-xs">
                      Không cấp giấy chứng nhận (Chỉ ghi nhận CSDL rèn luyện)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Ảnh bìa sự kiện (Poster 16:9) & Nội dung chi tiết */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-card border border-border space-y-4 shadow-2xs">
          <div className="border-b border-border pb-3">
            <h3 className="font-semibold text-base text-foreground font-heading">
              5. Ảnh bìa Poster sự kiện & Nội dung chi tiết
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tải lên hình ảnh poster thực tế và trình bày mục tiêu, diễn giả, lịch trình chi tiết.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Cột trái: Ảnh bìa Poster sự kiện (Tỷ lệ 16:9) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between h-5">
                <Label>
                  Ảnh bìa Poster sự kiện (Tỷ lệ 16:9) <span className="text-destructive">*</span>
                </Label>
              </div>

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
              <div className="space-y-2 pt-1">
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
            <div className="space-y-2">
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập nội dung, lộ trình, diễn giả và quyền lợi cụ thể của sự kiện... (Hỗ trợ định dạng xuống dòng, dán bài viết dài)"
                className={cn(
                  "leading-relaxed font-sans text-sm resize-y whitespace-pre-wrap transition-all shadow-2xs",
                  isExpandedDesc ? "min-h-[420px]" : "min-h-[220px]"
                )}
              />
              <p className="text-[11px] text-muted-foreground">
                Gợi ý: Bạn có thể kéo góc dưới bên phải để chỉnh chiều cao tùy ý. Các đoạn xuống dòng được bảo toàn nguyên vẹn khi hiển thị lên bài đăng.
              </p>

              {/* Từ khóa tìm kiếm (Tags) */}
              <div className="space-y-1.5 pt-2">
                <Label htmlFor="event-tags">Từ khóa tìm kiếm (Tags)</Label>
                <Input
                  id="event-tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Phân tách bởi dấu phẩy, ví dụ: việc làm, thực tập, công nghệ thông tin..."
                />
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
        initialSelectedId={selectedSv5tCriteria?.id}
        criterias={sv5tCriterias}
      />
    </div>
  )
}
