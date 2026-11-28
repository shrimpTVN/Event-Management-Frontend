import {
  extractApiFieldErrors,
  resolveApiErrorMessage,
  translateServerMessage,
} from '@/shared/utils/apiError'

export type EventFormErrors = Record<string, string>
export interface EventFormValues {
  name: string
  description: string
  location: string
  semesterId: number
  eventTypeId: number
  capacity: number | ''
  maleQuantity: number | ''
  femaleQuantity: number | ''
  dateHappen: string
  timeStart: string
  timeEnd: string
  dateOpen: string
  timeOpen: string
  dateClose: string
  timeClose: string
  hasBanner: boolean
}
export function localDateTime(date: string, time: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return NaN
  const value = new Date(`${date}T${time}:00`)
  const [year, month, day] = date.split('-').map(Number)
  return value.getFullYear() === year && value.getMonth() === month - 1 && value.getDate() === day
    ? value.getTime()
    : NaN
}
export function validateEventForm(
  values: EventFormValues,
  semesterIds: number[],
  eventTypeIds: number[]
): EventFormErrors {
  const errors: EventFormErrors = {}
  if (!values.name.trim()) errors.name = 'Vui lòng nhập tên sự kiện.'
  else if (values.name.trim().length > 255) errors.name = 'Tên sự kiện tối đa 255 ký tự.'
  if (!values.description.trim()) errors.description = 'Vui lòng nhập nội dung sự kiện.'
  if (!values.location.trim()) errors.location = 'Vui lòng nhập địa điểm tổ chức.'
  if (!semesterIds.includes(values.semesterId)) errors.semesterId = 'Vui lòng chọn học kỳ hợp lệ.'
  if (!eventTypeIds.includes(values.eventTypeId))
    errors.eventTypeId = 'Vui lòng chọn loại sự kiện hợp lệ.'
  const capacity = Number(values.capacity)
  if (!Number.isInteger(capacity) || capacity <= 0)
    errors.capacity = 'Số lượng tham gia phải là số nguyên lớn hơn 0.'
  for (const field of ['maleQuantity', 'femaleQuantity'] as const) {
    if (!Number.isInteger(Number(values[field])) || Number(values[field]) < 0)
      errors[field] = 'Số lượng phải là số nguyên không âm.'
  }
  if (Number(values.maleQuantity) + Number(values.femaleQuantity) > capacity) {
    errors.maleQuantity = 'Tổng chỉ tiêu nam và nữ không được vượt quá số lượng tham gia.'
    errors.femaleQuantity = errors.maleQuantity
  }
  const start = localDateTime(values.dateHappen, values.timeStart)
  const end = localDateTime(values.dateHappen, values.timeEnd)
  const open = localDateTime(values.dateOpen, values.timeOpen)
  const close = localDateTime(values.dateClose, values.timeClose)
  if (!Number.isFinite(localDateTime(values.dateHappen, '00:00')))
    errors.dateHappen = 'Vui lòng chọn ngày diễn ra hợp lệ.'
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(values.timeStart))
    errors.timeStart = 'Vui lòng chọn giờ bắt đầu hợp lệ.'
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(values.timeEnd))
    errors.timeEnd = 'Vui lòng chọn giờ kết thúc hợp lệ.'
  else if (end <= start) errors.timeEnd = 'Giờ kết thúc phải sau giờ bắt đầu.'
  if (!Number.isFinite(open)) errors.dateOpen = 'Vui lòng chọn đủ ngày và giờ mở đăng ký.'
  if (!Number.isFinite(close)) errors.dateClose = 'Vui lòng chọn đủ ngày và giờ đóng đăng ký.'
  else if (close <= open) errors.dateClose = 'Thời gian đóng đăng ký phải sau thời gian mở đăng ký.'
  else if (close > start)
    errors.dateClose = 'Thời gian đóng đăng ký không được sau giờ bắt đầu sự kiện.'
  if (open >= start) errors.dateOpen = 'Thời gian mở đăng ký phải trước giờ bắt đầu sự kiện.'
  if (!values.hasBanner) errors.bannerUrl = 'Vui lòng tải lên ảnh bìa sự kiện.'
  return errors
}

export function eventApiErrors(error: unknown): { fields: EventFormErrors; message: string } {
  const response = error as {
    response?: {
      data?: { data?: unknown; errors?: unknown; fieldErrors?: unknown; message?: string }
    }
    message?: string
  }
  const body = response?.response?.data
  const aliases: Record<string, string> = { dateEnd: 'timeEnd', criteriaId: 'criteriaIds' }
  const known = [
    'name',
    'description',
    'location',
    'semesterId',
    'eventTypeId',
    'schoolId',
    'capacity',
    'maleQuantity',
    'femaleQuantity',
    'dateHappen',
    'dateOpen',
    'dateClose',
    'format',
    'bannerUrl',
    'attendanceMethod',
    'attendanceSessionType',
    'hasCertificate',
    'tags',
    'eventPoints',
    'criteriaIds',
    'fanpageId',
    'timeEnd',
  ]

  const { fields, hasUnmappedFields } = extractApiFieldErrors(error, {
    allowedFields: known,
    aliases,
    defaultFieldFallback: 'Giá trị nhập vào chưa hợp lệ.',
  })

  const rawBodyMessage = typeof body?.message === 'string' ? body.message.trim() : ''
  // Compatibility with older backends returning Java Map.toString() as the message.
  for (const match of rawBodyMessage.matchAll(/([\w.\[\]]+)=([^=]+?)(?=,\s*[\w.\[\]]+=|}$)/g)) {
    const root = match[1].split(/[.\[]/)[0]
    const key = aliases[root] || root
    if (known.includes(key)) {
      fields[key] = translateServerMessage(match[2].trim(), 'Giá trị nhập vào chưa hợp lệ.')
    }
  }

  // Only infer date field from message text if BE did not already provide structured field errors.
  if (!Object.keys(fields).length && rawBodyMessage) {
    const lower = rawBodyMessage.toLowerCase()
    if (lower.includes('registration open date must be before'))
      fields.dateClose = 'Thời gian đóng đăng ký phải sau thời gian mở đăng ký.'
    if (lower.includes('registration close date must be before'))
      fields.dateClose = 'Thời gian đóng đăng ký không được sau giờ bắt đầu sự kiện.'
    if (lower.includes('event end must be after'))
      fields.timeEnd = 'Giờ kết thúc phải sau giờ bắt đầu.'
  }

  const message =
    hasUnmappedFields && !Object.keys(fields).length
      ? 'Dữ liệu sự kiện chưa hợp lệ. Vui lòng kiểm tra lại thông tin.'
      : resolveApiErrorMessage(error, 'Không thể lưu sự kiện. Vui lòng thử lại.')

  return { fields, message }
}
