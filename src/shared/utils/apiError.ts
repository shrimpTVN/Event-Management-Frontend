import type { ApiErrorResponse } from '../types/api.types'

interface ErrorLike {
  code?: string
  name?: string
  message?: string
  response?: {
    status?: number
    data?: Partial<ApiErrorResponse> | string | unknown
  }
}

const VIETNAMESE_CHAR_REGEX =
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i

const TECHNICAL_OR_RAW_REGEX =
  /^(request failed with status code|network error|timeout of \d+ms exceeded|err_|syntaxerror|typeerror)/i

const TECHNICAL_LEAK_REGEX =
  /(exception|stacktrace|jdbc|hibernate|constraintviolation|sqlstate|java\.|org\.springframework|\{[\w.\[\]]+=.+\})/i

const EXACT_OR_SUBSTRING_TRANSLATIONS: Array<[RegExp, string]> = [
  [/registration open date is required/i, 'Vui lòng chọn thời gian mở đăng ký.'],
  [/registration close date is required/i, 'Vui lòng chọn thời gian đóng đăng ký.'],
  [/event happen date is required/i, 'Vui lòng chọn ngày diễn ra sự kiện.'],
  [
    /registration open date cannot be in the past/i,
    'Thời gian mở đăng ký mới không được nằm trong quá khứ.',
  ],
  [
    /registration open date must be before or equal to registration close date/i,
    'Thời gian mở đăng ký phải trước hoặc bằng thời gian đóng đăng ký.',
  ],
  [
    /registration close date must be before or equal to event happen date/i,
    'Thời gian đóng đăng ký phải trước hoặc bằng thời gian diễn ra sự kiện.',
  ],
  [/event end must be after/i, 'Giờ kết thúc phải sau giờ bắt đầu.'],
  [/event capacity must be greater than 0/i, 'Số lượng tham gia phải lớn hơn 0.'],
  [/male and female quantities must be non-negative/i, 'Chỉ tiêu nam và nữ không được âm.'],
  [
    /event capacity cannot be lower than current registrations/i,
    'Số lượng tham gia không được nhỏ hơn số sinh viên đã đăng ký hiện tại.',
  ],
  [
    /male quantity cannot be lower than current male registrations/i,
    'Chỉ tiêu nam không được nhỏ hơn số sinh viên nam đã đăng ký.',
  ],
  [
    /female quantity cannot be lower than current female registrations/i,
    'Chỉ tiêu nữ không được nhỏ hơn số sinh viên nữ đã đăng ký.',
  ],
  [/a completed event cannot be updated/i, 'Sự kiện đã kết thúc nên không thể chỉnh sửa.'],
  [
    /cannot update an inactive event/i,
    'Sự kiện đã bị ẩn hoặc ngừng hoạt động nên không thể chỉnh sửa.',
  ],
  [/a completed event cannot be reopened/i, 'Sự kiện đã kết thúc nên không thể mở lại.'],
  [/school has been deactivated/i, 'Khoa/Trường đã ngừng hoạt động. Vui lòng chọn đơn vị khác.'],
  [/school not found/i, 'Không tìm thấy Khoa/Trường đã chọn.'],
  [/event\s*type not found/i, 'Loại sự kiện không hợp lệ hoặc không tồn tại.'],
  [/semester not found/i, 'Học kỳ không tồn tại hoặc không hợp lệ.'],
  [/academic year not found/i, 'Năm học không tồn tại hoặc không hợp lệ.'],
  [/fanpage not found/i, 'Không tìm thấy thông tin Fanpage.'],
  [/event not found/i, 'Không tìm thấy sự kiện.'],
  [/user not found/i, 'Không tìm thấy tài khoản người dùng tương ứng.'],
  [/already a member|already invited/i, 'Người dùng này đã là thành viên hoặc đã được mời trước đó.'],
  [/you are not admin|not a member|access denied|insufficient permission/i, 'Bạn không có quyền thực hiện thao tác này.'],
  [/not open yet|already closed/i, 'Sự kiện hiện chưa mở đăng ký hoặc đã hết thời hạn đăng ký.'],
  [/event is full|event capacity is full/i, 'Sự kiện đã đủ số lượng người tham gia.'],
  [/slots for your gender are full/i, 'Chỉ tiêu tham gia theo giới tính của bạn đã đủ.'],
  [/had registered|already registered/i, 'Bạn đã đăng ký tham gia sự kiện này rồi.'],
  [/after event close/i, 'Không thể hủy đăng ký sau khi sự kiện đã đóng hạn.'],
  [/self check-.*not allowed/i, 'Sự kiện đã tắt tính năng tự điểm danh. Vui lòng liên hệ ban tổ chức.'],
  [/not started yet/i, 'Sự kiện chưa bắt đầu hoặc hôm nay chưa phải ngày điểm danh.'],
  [/not registered/i, 'Bạn chưa đăng ký tham gia sự kiện này.'],
  [/has not checked in|cannot check out/i, 'Bạn chưa điểm danh đầu buổi nên chưa thể điểm danh cuối buổi.'],
  [/pending confirmation|already checkout/i, 'Bạn đã gửi minh chứng cuối buổi và đang chờ ban tổ chức xác nhận.'],
  [/already completed/i, 'Bạn đã hoàn tất điểm danh sự kiện này rồi.'],
  [/invalid username or password|invalid credentials|bad credentials/i, 'Thông tin đăng nhập không chính xác.'],
  [/old password does not match|old password is incorrect/i, 'Mật khẩu hiện tại không chính xác.'],
  [/password confirm does not match/i, 'Mật khẩu xác nhận không khớp với mật khẩu mới.'],
  [/expired or revoked refresh token/i, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'],
  [/invalid token|invalid refresh token/i, 'Mã xác thực không hợp lệ hoặc đã hết hạn.'],
  [/user is disabled/i, 'Tài khoản đã bị khóa hoặc tạm ngưng hoạt động.'],
  [/email already exists|account already exists with the given email/i, 'Email này đã được đăng ký trong hệ thống.'],
  [/student id already exists/i, 'Mã số sinh viên này đã tồn tại trong hệ thống.'],
  [/staff id already exists/i, 'Mã số cán bộ này đã tồn tại trong hệ thống.'],
  [/file must not be empty/i, 'Tệp tải lên không được để trống.'],
  [/file size exceeds/i, 'Dung lượng tệp vượt quá giới hạn cho phép.'],
  [/invalid file format/i, 'Định dạng tệp không hợp lệ. Vui lòng chọn ảnh PNG, JPG, WEBP hoặc GIF.'],
  [/failed to upload file/i, 'Không thể tải tệp lên máy chủ. Vui lòng thử lại.'],
  [/must not be blank|must not be empty|must not be null/i, 'Trường này không được để trống.'],
  [/must be greater than 0|must be greater than or equal to/i, 'Giá trị nhập vào chưa hợp lệ.'],
  [/well-formed email address|must be a valid email/i, 'Địa chỉ email không đúng định dạng.'],
  [
    /validation error|validation failed|required request body is missing or malformed/i,
    'Dữ liệu gửi lên chưa hợp lệ. Vui lòng kiểm tra lại.',
  ],
]

const CODE_TRANSLATIONS: Record<string, string> = {
  '005': 'Dữ liệu vừa thay đổi đồng thời. Vui lòng tải lại và thử lại.',
  '006': 'Dữ liệu đã tồn tại trong hệ thống.',
  '007': 'Không tìm thấy dữ liệu được yêu cầu.',
  'EVENT.001': 'Không tìm thấy sự kiện.',
  'EVENT.002': 'Sự kiện hiện chưa mở đăng ký hoặc đã hết thời hạn đăng ký.',
  'EVENT.003': 'Hiện chưa đến thời gian điểm danh của sự kiện.',
  'EVENT.004': 'Sự kiện đã đủ số lượng người tham gia.',
  'EVENT.005': 'Chỉ tiêu tham gia theo giới tính của bạn đã đủ.',
  'EVENT.006': 'Bạn đã đăng ký tham gia sự kiện này rồi.',
  'EVENT.007': 'Không thể hủy đăng ký sau khi sự kiện đã đóng hạn.',
  'EVENT.008': 'Sự kiện đã tắt tính năng tự điểm danh. Vui lòng liên hệ ban tổ chức.',
  'EVENT.009': 'Hiện chưa đến thời gian điểm danh của sự kiện.',
  'EVENT.010': 'Bạn chưa đăng ký tham gia sự kiện này.',
  'EVENT.011': 'Bạn đã điểm danh vào hoặc chưa đủ điều kiện điểm danh ra.',
  'EVENT.012': 'Bạn đã gửi minh chứng hoặc hoàn tất điểm danh sự kiện này rồi.',
  'STUDENT.001': 'Không tìm thấy hồ sơ sinh viên.',
  'STUDENT.002': 'Mã số sinh viên này đã tồn tại trong hệ thống.',
  'STUDENT.003': 'Tài khoản đã được liên kết với một hồ sơ sinh viên khác.',
  'AUTH.001': 'Đăng nhập không thành công. Vui lòng thử lại.',
  'AUTH.003': 'Email này đã được đăng ký trong hệ thống.',
  'AUTH.004': 'Phiên đăng nhập hoặc mã xác thực đã hết hạn.',
  'AUTH.005': 'Thông tin đăng nhập không chính xác.',
  'AUTH.007': 'Phiên đăng nhập đã hết hạn hoặc bị thu hồi. Vui lòng đăng nhập lại.',
  'AUTH.008': 'Mật khẩu xác nhận không khớp với mật khẩu mới.',
  'AUTH.009': 'Mật khẩu hiện tại không chính xác.',
  'AUTH.010': 'Tài khoản đã bị khóa hoặc tạm ngưng hoạt động.',
  'AUTH.015': 'Email này đã được đăng ký trong hệ thống.',
  'AUTH.016': 'Mã OTP không chính xác hoặc đã hết hạn.',
  'PASSWORD_ALREADY_SET': 'Tài khoản đã có mật khẩu. Vui lòng dùng chức năng đổi mật khẩu.',
  'PASSWORD_NOT_SET': 'Tài khoản chưa có mật khẩu. Vui lòng tạo mật khẩu lần đầu.',
  'STAFF_ID_ALREADY_EXISTS': 'Mã số cán bộ này đã tồn tại trong hệ thống.',
  'STAFF_PROFILE_ALREADY_EXISTS': 'Tài khoản đã có hồ sơ cán bộ.',
  'MEDIA.001': 'Tệp tải lên không được để trống.',
  'MEDIA.002': 'Dung lượng tệp vượt quá giới hạn cho phép.',
  'MEDIA.003': 'Định dạng tệp không hợp lệ.',
  'MEDIA.004': 'Không thể tải tệp lên máy chủ. Vui lòng thử lại.',
  'MEDIA.005': 'Không thể xóa tệp trên máy chủ. Vui lòng thử lại.',
  'USER.001': 'Vui lòng hoàn thiện hồ sơ sinh viên trước khi thực hiện thao tác này.',
  'USER.002': 'Vui lòng hoàn thiện hồ sơ cán bộ trước khi thực hiện thao tác này.',
}

function isCleanVietnameseMessage(text: string): boolean {
  if (!text || TECHNICAL_OR_RAW_REGEX.test(text) || TECHNICAL_LEAK_REGEX.test(text)) {
    return false
  }
  return VIETNAMESE_CHAR_REGEX.test(text)
}

/**
 * Translates a single server validation or error message into clean Vietnamese.
 * Never returns raw English technical/Axios text when a Vietnamese fallback is provided.
 */
export function translateServerMessage(raw: string | null | undefined, fallback: string): string {
  const trimmed = typeof raw === 'string' ? raw.trim() : ''
  if (!trimmed) return fallback

  const capacitySumMatch = trimmed.match(
    /total male and female quantities \((\d+)\) cannot exceed event capacity \((\d+)\)/i
  )
  if (capacitySumMatch) {
    return `Tổng chỉ tiêu nam và nữ (${capacitySumMatch[1]}) không được vượt quá số lượng tham gia (${capacitySumMatch[2]}).`
  }

  for (const [pattern, translation] of EXACT_OR_SUBSTRING_TRANSLATIONS) {
    if (pattern.test(trimmed)) return translation
  }

  if (isCleanVietnameseMessage(trimmed)) {
    return trimmed
  }

  return fallback
}

function getStructuredBody(error: unknown): Partial<ApiErrorResponse> | null {
  const err = error as ErrorLike | null | undefined
  const data = err?.response?.data
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null
  return data as Partial<ApiErrorResponse>
}

export function getApiErrorCode(error: unknown): string {
  const body = getStructuredBody(error)
  const code = body?.exceptionCode ?? body?.code
  return typeof code === 'string' ? code.trim() : ''
}

export interface ExtractFieldErrorsOptions {
  allowedFields?: readonly string[]
  aliases?: Record<string, string>
  defaultFieldFallback?: string
}

/**
 * Extracts and translates field-level validation errors from BE BaseResponse (`data`),
 * `fieldErrors`, or `errors` structures.
 */
export function extractApiFieldErrors(
  error: unknown,
  options: ExtractFieldErrorsOptions = {}
): { fields: Record<string, string>; hasUnmappedFields: boolean } {
  const { allowedFields, aliases = {}, defaultFieldFallback = 'Giá trị nhập vào chưa hợp lệ.' } = options
  const body = getStructuredBody(error)
  const rawDetails = body?.fieldErrors ?? body?.errors ?? body?.data
  const fields: Record<string, string> = {}
  let hasUnmappedFields = false

  const assignField = (rawField: string, rawMessage: unknown) => {
    const root = rawField.split(/[.\[]/)[0]
    const mappedKey = aliases[root] || root
    const joined = Array.isArray(rawMessage) ? rawMessage.join(' ') : String(rawMessage ?? '')
    const translated = translateServerMessage(joined, defaultFieldFallback)

    if (allowedFields && !allowedFields.includes(mappedKey)) {
      hasUnmappedFields = true
      return
    }
    fields[mappedKey] = translated
  }

  if (Array.isArray(rawDetails)) {
    for (const item of rawDetails) {
      if (item && typeof item === 'object' && 'field' in item && typeof item.field === 'string') {
        const msg =
          ('message' in item ? item.message : undefined) ??
          ('defaultMessage' in item ? item.defaultMessage : undefined)
        assignField(item.field, msg)
      }
    }
  } else if (rawDetails && typeof rawDetails === 'object') {
    for (const [field, msg] of Object.entries(rawDetails as Record<string, unknown>)) {
      assignField(field, msg)
    }
  }

  return { fields, hasUnmappedFields }
}

/**
 * Resolves any Axios/BE/JS error into a user-safe Vietnamese message without exposing
 * raw AxiosError messages or unhandled English exception text.
 */
export function resolveApiErrorMessage(error: unknown, fallback: string): string {
  const err = error as ErrorLike | null | undefined
  if (!err) return fallback

  if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError' || err.name === 'AbortError') {
    return fallback
  }

  const rawTopMessage = typeof err.message === 'string' ? err.message.trim() : ''
  if (
    err.code === 'ECONNABORTED' ||
    err.code === 'ETIMEDOUT' ||
    /timeout of \d+ms exceeded/i.test(rawTopMessage)
  ) {
    return 'Kết nối tới máy chủ quá thời gian chờ. Vui lòng thử lại.'
  }

  if (err.code === 'ERR_NETWORK' || /^network error$/i.test(rawTopMessage)) {
    return 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng và thử lại.'
  }

  const status = err.response?.status
  const body = getStructuredBody(error)
  const serverMsg = typeof body?.message === 'string' ? body.message.trim() : ''
  const isGenericValidationSummary = /^(validation error|validation failed)$/i.test(serverMsg)

  const { fields } = extractApiFieldErrors(error)
  const fieldMessages = Object.values(fields).filter(Boolean)
  if (isGenericValidationSummary && fieldMessages.length > 0) {
    return fieldMessages[0]
  }

  // If BE sent a known translatable or already-clean Vietnamese message, prefer it.
  if (serverMsg) {
    const translatedServer = translateServerMessage(serverMsg, '')
    if (translatedServer) return translatedServer
  }

  // Fallback to translated field errors when summary is generic or unmapped English.
  if (fieldMessages.length > 0) {
    return fieldMessages[0]
  }

  const rawCode = body?.exceptionCode ?? body?.code
  if (typeof rawCode === 'string' && CODE_TRANSLATIONS[rawCode]) {
    return CODE_TRANSLATIONS[rawCode]
  }

  if (status === 401) {
    return 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.'
  }
  if (status === 403) {
    return 'Bạn không có quyền thực hiện thao tác này.'
  }
  if (status === 404) {
    return 'Không tìm thấy dữ liệu được yêu cầu.'
  }
  if (status === 409) {
    return 'Dữ liệu vừa thay đổi hoặc bị xung đột. Vui lòng tải lại và thử lại.'
  }
  if (status === 413) {
    return 'Dung lượng tệp vượt quá giới hạn cho phép.'
  }
  if (typeof status === 'number' && status >= 500) {
    return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'
  }

  if (!err.response && rawTopMessage) {
    return translateServerMessage(rawTopMessage, fallback)
  }

  return fallback
}
