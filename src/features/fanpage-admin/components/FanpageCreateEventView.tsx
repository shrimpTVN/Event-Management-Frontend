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
} from 'lucide-react'
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



  // Cascading states cho Tiêu chuẩn & Tiêu chí Sinh viên 5 Tốt
  const [selectedSv5tL1Id, setSelectedSv5tL1Id] = useState<number | null>(null)
  const [selectedSv5tL2Id, setSelectedSv5tL2Id] = useState<number | null>(null)
  const [selectedSv5tL3Id, setSelectedSv5tL3Id] = useState<number | null>(null)
  const [hasCertificate, setHasCertificate] = useState<boolean>(
    initialEvent ? Boolean(initialEvent.hasCertificate) : false
  )

  // Lọc danh sách phân tầng Tiêu chí SV5T
  const sv5tL1List = useMemo(
    () => sv5tCriterias.filter((c) => c.level === 1 || c.parentId === 1),
    [sv5tCriterias]
  )

  const sv5tL2List = useMemo(
    () =>
      selectedSv5tL1Id
        ? sv5tCriterias.filter((c) => c.parentId === selectedSv5tL1Id)
        : [],
    [sv5tCriterias, selectedSv5tL1Id]
  )

  const sv5tL3List = useMemo(
    () =>
      selectedSv5tL2Id
        ? sv5tCriterias.filter((c) => c.parentId === selectedSv5tL2Id)
        : [],
    [sv5tCriterias, selectedSv5tL2Id]
  )

  const activeSv5tCriteria = useMemo(() => {
    if (selectedSv5tL3Id) return sv5tCriterias.find((c) => c.id === selectedSv5tL3Id)
    if (selectedSv5tL2Id) return sv5tCriterias.find((c) => c.id === selectedSv5tL2Id)
    if (selectedSv5tL1Id) return sv5tCriterias.find((c) => c.id === selectedSv5tL1Id)
    return undefined
  }, [sv5tCriterias, selectedSv5tL1Id, selectedSv5tL2Id, selectedSv5tL3Id])

  // 6. Nội dung & Poster (Schema: description, bannerUrl, tags)
  const [description, setDescription] = useState(initialEvent?.description || '')
  const [tags, setTags] = useState(
    initialEvent
      ? Array.isArray(initialEvent.tags)
        ? initialEvent.tags.join(', ')
        : initialEvent.tags || ''
      : ''
  )
  const [bannerPreview, setBannerPreview] = useState(initialEvent?.bannerUrl || '')
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
      setSelectedSv5tL1Id(null)
      setSelectedSv5tL2Id(null)
      setSelectedSv5tL3Id(null)
      setHasCertificate(false)
      setDescription('')
      setTags('')
      setBannerPreview('')
    }
  }, [initialEvent])



  // Tự động khôi phục phân tầng Tiêu chí SV5T khi chỉnh sửa
  useEffect(() => {
    if (!initialEvent || sv5tCriterias.length === 0) return
    const critId = initialEvent.sv5tCriteriaId
    if (!critId) return

    const target = sv5tCriterias.find((c) => c.id === critId)
    if (!target) return

    if (target.level === 3) {
      setSelectedSv5tL3Id(target.id)
      const l2 = sv5tCriterias.find((c) => c.id === target.parentId)
      if (l2) {
        setSelectedSv5tL2Id(l2.id)
        const l1 = sv5tCriterias.find((c) => c.id === l2.parentId)
        if (l1) setSelectedSv5tL1Id(l1.id)
      }
    } else if (target.level === 2) {
      setSelectedSv5tL2Id(target.id)
      const l1 = sv5tCriterias.find((c) => c.id === target.parentId)
      if (l1) setSelectedSv5tL1Id(l1.id)
    } else if (target.level === 1) {
      setSelectedSv5tL1Id(target.id)
    }
  }, [initialEvent, sv5tCriterias])

  // Xử lý tải ảnh poster thật từ thiết bị kèm Live Preview trực tiếp
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const previewUrl = URL.createObjectURL(file)
      setBannerPreview(previewUrl)
    }
  }

  // Chọn ảnh mẫu có sẵn
  const handleUseSampleImage = () => {
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

    setIsSubmitting(true)


    const activeSv5tId = activeSv5tCriteria?.id
    const activeSv5tName = activeSv5tCriteria?.name
    const selectedEventType = MOCK_EVENT_TYPES.find((t) => t.id === eventTypeId)
    const selectedSemester = MOCK_SEMESTERS.find((s) => s.id === semesterId)

    const dateOpenIso = dateOpen ? `${dateOpen}T${timeOpen || '07:00'}:00Z` : undefined
    const dateCloseIso = dateClose ? `${dateClose}T${timeClose || '23:59'}:00Z` : undefined
    const dateHappenIso = dateHappen ? `${dateHappen}T${timeStart || '08:00'}:00Z` : ''

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
      capacity: Number(capacity) || 0,
      maleQuantity: maleQuantity !== '' ? Number(maleQuantity) : undefined,
      femaleQuantity: femaleQuantity !== '' ? Number(femaleQuantity) : undefined,
      registeredCount: initialEvent ? initialEvent.registeredCount : 0,
      checkedInCount: initialEvent ? initialEvent.checkedInCount : 0,
      status: isPublished ? 'PUBLISHED' : (initialEvent ? initialEvent.status : 'DRAFT'),
      bannerUrl: bannerPreview,
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
          dateHappen: dateHappenIso,
          dateOpen: dateOpenIso,
          dateClose: dateCloseIso,
          capacity: eventPayload.capacity,
          maleQuantity: eventPayload.maleQuantity,
          femaleQuantity: eventPayload.femaleQuantity,
          bannerUrl: eventPayload.bannerUrl,
          status: eventPayload.status,
          eventTypeId: eventPayload.eventTypeId,
          semesterId: eventPayload.semesterId,
          criteriaId: eventPayload.sv5tCriteriaId,
          eventPoints: selectedPointCategories.map((c) => ({ pointCategoryId: c.pointCategoryId, point: c.point })),
        } as any)
      } else {
        await fanpageAdminService.createAdminEvent({
          name: eventPayload.name,
          description: eventPayload.description,
          location: eventPayload.location,
          dateHappen: dateHappenIso,
          dateOpen: dateOpenIso,
          dateClose: dateCloseIso,
          capacity: eventPayload.capacity,
          maleQuantity: eventPayload.maleQuantity,
          femaleQuantity: eventPayload.femaleQuantity,
          bannerUrl: eventPayload.bannerUrl,
          status: eventPayload.status,
          eventTypeId: eventPayload.eventTypeId,
          fanpageId: Number(currentFanpage?.id || 1),
          semesterId: eventPayload.semesterId,
          criteriaId: eventPayload.sv5tCriteriaId,
          eventPoints: selectedPointCategories.map((c) => ({ pointCategoryId: c.pointCategoryId, point: c.point })),
        } as any)
      }
    } catch (err) {
      console.warn('API error during event save, saving local state', err)
    }

    setIsSubmitting(false)
    onSaveEvent(eventPayload, isPublished)
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
            disabled={isSubmitting}
            className="h-9 px-4 text-xs font-medium cursor-pointer"
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="h-9 px-4 text-xs font-medium cursor-pointer"
          >
            Lưu bản nháp
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            className="h-9 px-4 text-xs font-semibold bg-primary hover:bg-primary/95 text-white flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Check className="h-4 w-4" />
            <span>{isEditMode ? 'Cập nhật sự kiện' : 'Xuất bản sự kiện'}</span>
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

            {/* Loại sự kiện */}
            <div className="space-y-1.5">
              <Label htmlFor="event-type">
                Loại sự kiện <span className="text-destructive">*</span>
              </Label>
              <Select
                value={String(eventTypeId)}
                onValueChange={(val) => setEventTypeId(Number(val))}
              >
                <SelectTrigger id="event-type">
                  <SelectValue placeholder="Chọn loại sự kiện" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_EVENT_TYPES.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            {/* Nhóm 3: Hình thức xét duyệt đơn */}
            <div className="space-y-1.5">
              <Label htmlFor="approval-mode">Hình thức xét duyệt đơn đăng ký</Label>
              <Select
                value={requiresApproval ? 'MANUAL_APPROVAL' : 'AUTO_APPROVE'}
                onValueChange={(val) => setRequiresApproval(val === 'MANUAL_APPROVAL')}
              >
                <SelectTrigger id="approval-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUTO_APPROVE">
                    Tự động duyệt (Sinh viên đăng ký thành công ngay)
                  </SelectItem>
                  <SelectItem value="MANUAL_APPROVAL">
                    Yêu cầu xét duyệt (Ban tổ chức duyệt đơn)
                  </SelectItem>
                </SelectContent>
              </Select>
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
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      Tổng: +{totalTrainingPoints} ĐRL
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

              {/* Tiêu chuẩn SV5T Cấp 1 */}
              <div className="space-y-1.5">
                <Label htmlFor="sv5t-standard">Tiêu chuẩn Sinh viên 5 Tốt</Label>
                <Select
                  value={selectedSv5tL1Id ? String(selectedSv5tL1Id) : 'none'}
                  onValueChange={(val) => {
                    if (val === 'none') {
                      setSelectedSv5tL1Id(null)
                      setSelectedSv5tL2Id(null)
                      setSelectedSv5tL3Id(null)
                    } else {
                      const id = Number(val)
                      setSelectedSv5tL1Id(id)
                      setSelectedSv5tL2Id(null)
                      setSelectedSv5tL3Id(null)
                    }
                  }}
                >
                  <SelectTrigger id="sv5t-standard" className="text-left text-xs">
                    <SelectValue placeholder="Chọn tiêu chuẩn..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="none" className="text-xs italic text-muted-foreground">
                      -- Không áp dụng tiêu chí SV5T --
                    </SelectItem>
                    {sv5tL1List.map((crit) => (
                      <SelectItem key={crit.id} value={String(crit.id)} className="text-xs">
                        {crit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tiêu chí cụ thể Cấp 2 */}
              {selectedSv5tL1Id && sv5tL2List.length > 0 && (
                <div className="space-y-1.5 animate-in fade-in duration-150">
                  <Label htmlFor="sv5t-detail">Tiêu chí con cụ thể</Label>
                  <Select
                    value={selectedSv5tL2Id ? String(selectedSv5tL2Id) : ''}
                    onValueChange={(val) => {
                      const id = Number(val)
                      setSelectedSv5tL2Id(id)
                      setSelectedSv5tL3Id(null)
                    }}
                  >
                    <SelectTrigger id="sv5t-detail" className="text-left text-xs">
                      <SelectValue placeholder="Chọn tiêu chí con..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {sv5tL2List.map((crit) => (
                        <SelectItem key={crit.id} value={String(crit.id)} className="text-xs">
                          {crit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Tiêu chí chi tiết Cấp 3 (nếu có) */}
              {selectedSv5tL2Id && sv5tL3List.length > 0 && (
                <div className="space-y-1.5 animate-in fade-in duration-150">
                  <Label htmlFor="sv5t-sub-detail">Mục chi tiết bổ sung</Label>
                  <Select
                    value={selectedSv5tL3Id ? String(selectedSv5tL3Id) : ''}
                    onValueChange={(val) => setSelectedSv5tL3Id(Number(val))}
                  >
                    <SelectTrigger id="sv5t-sub-detail" className="text-left text-xs">
                      <SelectValue placeholder="Chọn mục chi tiết..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {sv5tL3List.map((crit) => (
                        <SelectItem key={crit.id} value={String(crit.id)} className="text-xs">
                          {crit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
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
                <span className="text-[11px] text-muted-foreground">
                  {description.length} ký tự
                </span>
              </div>

              <Textarea
                id="event-description"
                rows={7}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập nội dung, lộ trình, diễn giả và quyền lợi cụ thể của sự kiện..."
                className="leading-relaxed resize-none h-[180px]"
              />

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
          disabled={isSubmitting}
          className="h-9 px-4 text-xs font-medium cursor-pointer"
        >
          Hủy bỏ
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleSubmit(false)}
          disabled={isSubmitting}
          className="h-9 px-4 text-xs font-medium cursor-pointer"
        >
          Lưu bản nháp
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => handleSubmit(true)}
          disabled={isSubmitting}
          className="h-9 px-4 text-xs font-semibold bg-primary hover:bg-primary/95 text-white flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Check className="h-4 w-4" />
          <span>Xuất bản sự kiện</span>
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
    </div>
  )
}
