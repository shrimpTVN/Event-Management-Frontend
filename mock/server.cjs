const path = require('path')
const express = require('express')
const jsonServer = require('json-server')

const server = jsonServer.create()
const router = jsonServer.router(path.join(__dirname, 'db.json'))
const middlewares = jsonServer.defaults({ cors: true })

server.use(middlewares)
server.use(jsonServer.bodyParser)

const apiRouter = express.Router()

// -------------------------------------------------------------
// Envelope Helpers
// -------------------------------------------------------------
function successEnvelope(data, message = 'Success') {
  return {
    data,
    message,
    exceptionCode: null,
  }
}

function errorEnvelope(message, exceptionCode = 'VALIDATION_ERROR', data = null) {
  return {
    data,
    message,
    exceptionCode,
  }
}

function makePageResponse(items, page = 0, size = 10) {
  const p = Number(page) || 0
  const s = Number(size) || 10
  const totalElements = items.length
  const totalPages = Math.ceil(totalElements / s) || 1
  const startIndex = p * s
  const content = items.slice(startIndex, startIndex + s)

  return {
    content,
    pageable: {
      pageNumber: p,
      pageSize: s,
      sort: { sorted: true, empty: false, unsorted: false },
      offset: startIndex,
      paged: true,
      unpaged: false,
    },
    totalElements,
    totalPages,
    last: p >= totalPages - 1,
    size: s,
    number: p,
    numberOfElements: content.length,
    first: p === 0,
    empty: content.length === 0,
  }
}

// -------------------------------------------------------------
// Model DTO Builders
// -------------------------------------------------------------
function getDb() {
  return router.db
}

function resolveUserRole(userId) {
  const db = getDb()
  const userRole = db.get('user_roles').find({ userId: Number(userId) }).value()
  if (!userRole) return 'STUDENT'
  const role = db.get('roles').find({ id: userRole.roleId }).value()
  return role ? role.name : 'STUDENT'
}

function getCurrentUserIdFromRequest(req) {
  // 1. Check Authorization Bearer header (format: Bearer mock-jwt-token-{userId}-{timestamp})
  const authHeader = req.headers.authorization || ''
  if (authHeader.startsWith('Bearer mock-jwt-token-')) {
    const parts = authHeader.replace('Bearer mock-jwt-token-', '').split('-')
    const uid = Number(parts[0])
    if (!isNaN(uid) && uid > 0) return uid
  }
  // 2. Check Cookie ddd_jwt
  const cookieHeader = req.headers.cookie || ''
  const cookies = cookieHeader.split(';').reduce((acc, c) => {
    const [k, v] = c.trim().split('=')
    if (k) acc[k] = v
    return acc
  }, {})
  if (cookies.ddd_jwt && cookies.ddd_jwt.startsWith('mock-jwt-token-')) {
    const parts = cookies.ddd_jwt.replace('mock-jwt-token-', '').split('-')
    const uid = Number(parts[0])
    if (!isNaN(uid) && uid > 0) return uid
  }
  return 1
}

function buildUserProfileDto(userId) {
  const db = getDb()
  const user = db.get('users').find({ id: Number(userId) }).value()
  if (!user) return null

  const studentProfile = db.get('student_profiles').find({ userId: user.id }).value()
  const staffProfile = db.get('fanpage_admin_profiles').find({ userId: user.id }).value()
  const roleName = resolveUserRole(user.id)

  const fullName = `${user.lastName} ${user.firstName}`.trim()

  // 1. Student Persona
  if (studentProfile) {
    const major = db.get('majors').find({ id: studentProfile.majorId }).value()
    const school = major ? db.get('schools').find({ id: major.schoolId }).value() : null
    const association = db.get('associations').find({ id: studentProfile.associationId }).value()
    const kNum = String(studentProfile.kNumber || 49)
    const majorName = major ? major.name : 'Kỹ thuật phần mềm'
    const majorCode = major ? major.code : '7480103'
    const schoolName = school ? school.name : 'Trường Công nghệ Thông tin và Truyền thông'
    const assocName = association ? association.name : 'Đoàn Trường Đại học Cần Thơ'

    return {
      // Backend canonical fields
      id: String(user.id),
      email: user.email,
      role: roleName,
      isActive: user.isActive,
      firstName: user.firstName,
      lastName: user.lastName,
      name: fullName,
      studentId: studentProfile.studentId || null,
      gender: user.gender,
      kNumber: kNum,
      avatarUrl: user.avatarUrl,
      associationName: assocName,
      majorName,
      majorCode,
      schoolName,
      isProfileComplete: true,
      // UI alias fields
      fullName,
      status: studentProfile.status || 'Đang học',
      classId: studentProfile.classId || null,
      cohort: `K${kNum} (2023 - 2027)`,
      dateOfBirth: user.dateOfBirth || null,
      bio: studentProfile.bio || '',
      phoneNumber: user.phoneNumber || '',
      faculty: schoolName,
      major: majorName,
      academicProgram: studentProfile.academicProgram || 'Đại trà (Chương trình chuẩn)',
      youthUnionBranch: assocName,
    }
  }

  // 2. Staff / Fanpage Admin / System Admin Persona (Clean, no student hardcoding)
  return {
    id: String(user.id),
    email: user.email,
    role: roleName,
    isActive: user.isActive,
    firstName: user.firstName,
    lastName: user.lastName,
    name: fullName,
    studentId: null,
    staffId: staffProfile ? staffProfile.staffId : (user.id === 3 ? 'ADMIN-01' : null),
    gender: user.gender,
    kNumber: null,
    avatarUrl: user.avatarUrl,
    associationName: staffProfile ? staffProfile.orgName : 'Trường Đại học Cần Thơ',
    majorName: null,
    majorCode: null,
    schoolName: 'Trường Đại học Cần Thơ',
    isProfileComplete: true,
    fullName,
    status: 'Cán bộ đang công tác',
    classId: null,
    cohort: null,
    dateOfBirth: (staffProfile && staffProfile.dob) || user.dateOfBirth || null,
    bio: staffProfile ? `${staffProfile.title} - ${staffProfile.orgName}` : 'Quản trị viên hệ thống',
    phoneNumber: (staffProfile && staffProfile.phoneNumber) || user.phoneNumber || '',
    faculty: staffProfile ? staffProfile.orgName : 'Ban Giám hiệu / Quản trị hệ thống',
    major: null,
    academicProgram: null,
    youthUnionBranch: staffProfile ? staffProfile.orgName : 'Đoàn Trường Đại học Cần Thơ',
  }
}

function buildStudentProfileDto(userId) {
  return buildUserProfileDto(userId)
}

function buildEventResponseDto(event, currentUserId = 1) {
  const db = getDb()
  const eventType = db.get('event_types').find({ id: event.eventTypeId }).value()
  const criteria = db.get('criterias').find({ id: event.criteriaId }).value()
  const fanpage = db.get('fanpages').find({ id: event.fanpageId }).value()
  const semester = db.get('semesters').find({ id: event.semesterId }).value()
  const eventPoints = db.get('event_points').filter({ eventId: event.id }).value() || []
  const pointCategories = db.get('point_categories').value() || []
  const allRegs = db.get('registrations').value() || []
  const registrations = allRegs.filter((r) => String(r.eventId) === String(event.id))
  const isRegistered = registrations.some(
    (r) => String(r.userId) === String(currentUserId) && r.status !== 'CANCELLED'
  )

  const mappedPoints = eventPoints.map((ep) => {
    const pc = pointCategories.find((cat) => cat.id === ep.pointCategoryId)
    return {
      pointCategoryId: ep.pointCategoryId,
      pointCategoryName: pc ? pc.name : 'Điểm rèn luyện',
      point: ep.point,
    }
  })

  return {
    id: event.id,
    name: event.name,
    title: event.name, // Frontend UI alias
    description: event.description,
    location: {
      type: 'OFFLINE',
      address: event.location,
      city: 'Đại học Cần Thơ',
    },
    dateOpen: event.dateOpen,
    dateClose: event.dateClose,
    dateHappen: event.dateHappen,
    startTime: event.dateHappen, // Frontend UI alias
    endTime: event.dateHappen,   // Frontend UI alias
    capacity: event.capacity,
    registeredCount: registrations.length,
    maleQuantity: event.maleQuantity,
    femaleQuantity: event.femaleQuantity,
    bannerUrl: event.bannerUrl,
    status: event.status,
    eventTypeName: eventType ? eventType.name : 'General',
    category: (eventType ? eventType.name : 'OTHER').toUpperCase(), // Frontend UI alias
    criteriaName: criteria ? criteria.name : '',
    fanpageName: fanpage ? fanpage.name : '',
    fanpageId: event.fanpageId,
    organizerId: String(event.fanpageId), // Frontend UI alias
    organizerName: fanpage ? fanpage.name : '', // Frontend UI alias
    organizerAvatarUrl: fanpage ? fanpage.avatarUrl : '', // Frontend UI alias
    isActive: event.isActive,
    isModerationRequired: event.capacity < 400,
    semester: semester
      ? {
          id: semester.id,
          number: semester.number,
          academicYear: semester.academicYear,
          startDate: semester.startDate,
          endDate: semester.endDate,
          status: semester.status,
        }
      : null,
    eventPoints: mappedPoints,
    pointsReward: mappedPoints.length > 0 ? `Cộng 0${mappedPoints[0].point} điểm rèn luyện` : '',
    quotaText: `${event.capacity} sinh viên`,
    timeAgo: '1 ngày trước',
    isFollowed: true,
    isSaved: false,
    isRegistered,
    updatedAt: event.updatedAt || new Date().toISOString(),
    createdAt: event.updatedAt || new Date().toISOString(),
  }
}

// -------------------------------------------------------------
// 1. Authentication Endpoints (/api/auth)
// -------------------------------------------------------------
apiRouter.post('/auth/login', (req, res) => {
  const { email, password } = req.body
  const db = getDb()
  const users = db.get('users').value() || []
  const normalizedEmail = (email || '').toLowerCase()

  let user = null
  if (normalizedEmail.includes('admin')) {
    user = users.find((u) => u.id === 3) || users[2]
  } else if (
    normalizedEmail.includes('organizer') ||
    normalizedEmail.includes('staff') ||
    normalizedEmail.includes('canbo')
  ) {
    user = users.find((u) => u.id === 2) || users[1]
  } else {
    user = users.find((u) => u.id === 1) || users[0]
  }

  // Validate password: must match '123123'
  if (password && password !== '123123' && user.password !== password) {
    return res.status(401).json(errorEnvelope('Mật khẩu không chính xác. Mật khẩu mặc định là 123123', 'AUTH_INVALID_CREDENTIALS'))
  }

  const roleName = resolveUserRole(user.id)
  const token = `mock-jwt-token-${user.id}-${Date.now()}`

  res.cookie('ddd_jwt', token, {
    httpOnly: true,
    maxAge: 86400000,
    sameSite: 'lax',
    path: '/',
  })
  res.cookie('ddd_refresh', `mock-refresh-${user.id}-${Date.now()}`, {
    httpOnly: true,
    maxAge: 604800000,
    sameSite: 'lax',
    path: '/',
  })

  const fullUserProfile = buildUserProfileDto(user.id)
  const springRole = `ROLE_${roleName}`

  return res.json(
    successEnvelope({
      userId: user.id,
      email: user.email,
      roles: [springRole],
      role: springRole,
      user: fullUserProfile,
      tokens: { accessToken: token },
    }, 'Đăng nhập thành công')
  )
})

apiRouter.post('/auth/register', (req, res) => {
  return res.json(successEnvelope({ success: true, email: req.body.email }, 'Đăng ký thành công'))
})

apiRouter.post('/auth/register/fanpage-admin', (req, res) => {
  return res.json(successEnvelope(null, 'Đăng ký quản trị viên fanpage thành công'))
})

apiRouter.post('/auth/refresh-token', (_req, res) => {
  return res.json(successEnvelope(null, 'Làm mới token thành công'))
})

apiRouter.post('/auth/logout', (_req, res) => {
  res.clearCookie('ddd_jwt', { path: '/' })
  res.clearCookie('ddd_refresh', { path: '/' })
  return res.json(successEnvelope(null, 'Đăng xuất thành công'))
})

apiRouter.post('/auth/google', (req, res) => {
  const token = 'mock-google-jwt-' + Date.now()
  res.cookie('ddd_jwt', token, { httpOnly: true, maxAge: 86400000, sameSite: 'lax', path: '/' })
  const user = buildStudentProfileDto(1)
  return res.json(successEnvelope({ user, tokens: { accessToken: token } }, 'Google auth success'))
})

apiRouter.post('/auth/verify-otp', (_req, res) => {
  return res.json(successEnvelope({ success: true }, 'Xác thực OTP thành công'))
})

apiRouter.post('/auth/resend-otp', (_req, res) => {
  return res.json(successEnvelope({ success: true }, 'Mã OTP đã được gửi lại'))
})

apiRouter.get('/auth/me', (req, res) => {
  const userId = getCurrentUserIdFromRequest(req)
  const profile = buildUserProfileDto(userId)
  return res.json(successEnvelope(profile))
})

apiRouter.post('/auth/student-profile', (req, res) => {
  const profile = { ...buildUserProfileDto(1), ...req.body, isProfileComplete: true }
  return res.json(successEnvelope(profile, 'Cập nhật hồ sơ sinh viên thành công'))
})

apiRouter.post('/auth/staff-profile', (req, res) => {
  const profile = { ...buildUserProfileDto(2), ...req.body, isProfileComplete: true }
  return res.json(successEnvelope(profile, 'Cập nhật hồ sơ cán bộ thành công'))
})

// -------------------------------------------------------------
// 2. Users & Profiles Endpoints (/api/users)
// -------------------------------------------------------------
apiRouter.get('/users/me/profile', (req, res) => {
  const userId = getCurrentUserIdFromRequest(req)
  const profile = buildUserProfileDto(userId)
  return res.json(successEnvelope(profile))
})

apiRouter.put('/users/me/profile', (req, res) => {
  const userId = getCurrentUserIdFromRequest(req)
  const profile = { ...buildUserProfileDto(userId), ...req.body }
  return res.json(successEnvelope(profile, 'Cập nhật thành công'))
})

apiRouter.patch('/users/me/profile/change-avatar', (req, res) => {
  return res.json(successEnvelope({ avatarUrl: req.body.avatarUrl }, 'Đổi ảnh đại diện thành công'))
})

apiRouter.get('/users/admin/profiles', (req, res) => {
  const { page = 0, size = 10 } = req.query
  const profiles = [buildStudentProfileDto(1)]
  return res.json(successEnvelope(makePageResponse(profiles, page, size)))
})

apiRouter.get('/users/admin', (req, res) => {
  const { page = 0, size = 10 } = req.query
  const users = getDb().get('users').value() || []
  const dtos = users.map((u) => ({
    id: u.id,
    email: u.email,
    role: resolveUserRole(u.id),
    isActive: u.isActive,
  }))
  return res.json(successEnvelope(makePageResponse(dtos, page, size)))
})

// -------------------------------------------------------------
// 3. Events Endpoints (/api/events)
// -------------------------------------------------------------
apiRouter.get('/events', (req, res) => {
  const { keyword, eventTypeId, fanpageId, status, page = 0, size = 10 } = req.query
  let events = getDb().get('events').value() || []

  if (keyword) {
    const kw = String(keyword).toLowerCase()
    events = events.filter(
      (e) =>
        e.name.toLowerCase().includes(kw) ||
        e.description.toLowerCase().includes(kw) ||
        e.location.toLowerCase().includes(kw)
    )
  }
  if (eventTypeId) {
    events = events.filter((e) => e.eventTypeId === Number(eventTypeId))
  }
  if (fanpageId) {
    events = events.filter((e) => e.fanpageId === Number(fanpageId))
  }
  if (status) {
    events = events.filter((e) => e.status === status)
  }

  const currentUserId = getCurrentUserIdFromRequest(req) || 1
  const dtos = events.map((e) => buildEventResponseDto(e, currentUserId))
  return res.json(successEnvelope(makePageResponse(dtos, page, size)))
})

apiRouter.get('/events/fanpage/:fanpageId', (req, res) => {
  const { fanpageId } = req.params
  const { page = 0, size = 10 } = req.query
  const currentUserId = getCurrentUserIdFromRequest(req) || 1
  const events = getDb().get('events').filter({ fanpageId: Number(fanpageId) }).value() || []
  const dtos = events.map((e) => buildEventResponseDto(e, currentUserId))
  return res.json(successEnvelope(makePageResponse(dtos, page, size)))
})

apiRouter.get('/events/:id', (req, res) => {
  const { id } = req.params
  const currentUserId = getCurrentUserIdFromRequest(req) || 1
  const event = getDb().get('events').find({ id: Number(id) }).value()
  if (!event) {
    return res.status(404).json(errorEnvelope('Không tìm thấy sự kiện', 'RESOURCE_NOT_FOUND'))
  }
  return res.json(successEnvelope(buildEventResponseDto(event, currentUserId)))
})

apiRouter.post('/events/fanpage-member', (req, res) => {
  const db = getDb()
  const events = db.get('events').value() || []
  const nextId = events.length > 0 ? Math.max(...events.map((e) => e.id)) + 1 : 1

  const newEvent = {
    id: nextId,
    name: req.body.name || 'Sự kiện mới',
    description: req.body.description || '',
    location: req.body.location || 'Khu II, ĐHCT',
    dateOpen: req.body.dateOpen || new Date().toISOString(),
    dateClose: req.body.dateClose || new Date().toISOString(),
    dateHappen: req.body.dateHappen || new Date().toISOString(),
    capacity: Number(req.body.capacity) || 100,
    maleQuantity: Number(req.body.maleQuantity) || 50,
    femaleQuantity: Number(req.body.femaleQuantity) || 50,
    bannerUrl: req.body.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
    status: 'PUBLISHED',
    eventTypeId: Number(req.body.eventTypeId) || 1,
    criteriaId: Number(req.body.criteriaId) || 10,
    fanpageId: Number(req.body.fanpageId) || 1,
    semesterId: Number(req.body.semesterId) || 1,
    isActive: true,
    updatedAt: new Date().toISOString(),
  }

  db.get('events').push(newEvent).write()
  return res.json(successEnvelope(buildEventResponseDto(newEvent), 'Tạo sự kiện thành công'))
})

apiRouter.put('/events/fanpage-member/:id', (req, res) => {
  const { id } = req.params
  const db = getDb()
  const event = db.get('events').find({ id: Number(id) }).value()
  if (!event) {
    return res.status(404).json(errorEnvelope('Không tìm thấy sự kiện', 'RESOURCE_NOT_FOUND'))
  }
  const updated = db.get('events').find({ id: Number(id) }).assign({
    ...req.body,
    updatedAt: new Date().toISOString(),
  }).write()
  return res.json(successEnvelope(buildEventResponseDto(updated), 'Cập nhật sự kiện thành công'))
})

apiRouter.patch('/events/fanpage-member/:id/status', (req, res) => {
  const { id } = req.params
  const { status } = req.query
  const db = getDb()
  const event = db.get('events').find({ id: Number(id) }).assign({ status, updatedAt: new Date().toISOString() }).write()
  return res.json(successEnvelope(event, 'Đổi trạng thái sự kiện thành công'))
})

apiRouter.delete('/events/admin/:id', (req, res) => {
  getDb().get('events').remove({ id: Number(req.params.id) }).write()
  return res.json(successEnvelope(null, 'Xóa sự kiện thành công'))
})

apiRouter.delete('/events/fanpage-member/:id', (req, res) => {
  getDb().get('events').remove({ id: Number(req.params.id) }).write()
  return res.json(successEnvelope(null, 'Xóa sự kiện thành công'))
})

// -------------------------------------------------------------
// 4. Registrations & Attendance Endpoints (/api/registrations)
// -------------------------------------------------------------
// 4. Registrations & Attendance Endpoints (/api/registrations)
// -------------------------------------------------------------
function registerEventInDb(userId, eventId) {
  const db = getDb()
  const uid = Number(userId) || 1
  const eid = Number(eventId)
  const existing = db.get('registrations').find({ userId: uid, eventId: eid }).value()
  if (existing) {
    if (existing.status === 'CANCELLED') {
      db.get('registrations')
        .find({ userId: uid, eventId: eid })
        .assign({
          status: 'REGISTERED',
          regDate: new Date().toISOString(),
          reason: null,
        })
        .write()
    }
    return { isNew: false, registration: existing }
  }

  const newReg = {
    userId: uid,
    eventId: eid,
    regDate: new Date().toISOString(),
    checkInAt: null,
    checkInEvidenceUrl: null,
    checkOutAt: null,
    checkOutEvidenceUrl: null,
    status: 'REGISTERED',
    reason: null,
  }

  db.get('registrations').push(newReg).write()
  return { isNew: true, registration: newReg }
}

function cancelEventInDb(userId, eventId, reason = 'Hủy đăng ký từ giao diện') {
  const db = getDb()
  const uid = Number(userId) || 1
  const eid = Number(eventId)
  const existing = db.get('registrations').find({ userId: uid, eventId: eid }).value()
  if (existing) {
    db.get('registrations')
      .find({ userId: uid, eventId: eid })
      .assign({
        status: 'CANCELLED',
        reason,
      })
      .write()
    return true
  }
  return false
}

apiRouter.post('/registrations/me/events/:eventId', (req, res) => {
  const eventId = Number(req.params.eventId)
  const currentUserId = getCurrentUserIdFromRequest(req) || 1
  const result = registerEventInDb(currentUserId, eventId)
  return res.json(
    successEnvelope(
      {
        id: `reg-${eventId}`,
        eventId,
        registeredAt: result.registration.regDate,
        status: 'CONFIRMED',
      },
      'Đăng ký tham gia sự kiện thành công'
    )
  )
})

apiRouter.post('/registrations', (req, res) => {
  const eventId = Number(req.body?.eventId)
  const currentUserId = getCurrentUserIdFromRequest(req) || 1
  if (!eventId || isNaN(eventId)) {
    return res.status(400).json(errorEnvelope('Thiếu mã sự kiện (eventId)'))
  }
  const result = registerEventInDb(currentUserId, eventId)
  return res.json(
    successEnvelope(
      {
        id: `reg-${eventId}`,
        eventId,
        registeredAt: result.registration.regDate,
        status: 'CONFIRMED',
      },
      'Đăng ký tham gia sự kiện thành công'
    )
  )
})

apiRouter.patch('/registrations/me/events/:eventId/cancel', (req, res) => {
  const eventId = Number(req.params.eventId)
  const currentUserId = getCurrentUserIdFromRequest(req) || 1
  cancelEventInDb(currentUserId, eventId, req.body?.reason)
  return res.json(successEnvelope({ cancelled: true, eventId }, 'Hủy đăng ký thành công'))
})

apiRouter.get('/registrations/me/history', (req, res) => {
  const { page = 0, size = 10 } = req.query
  const db = getDb()
  const currentUserId = getCurrentUserIdFromRequest(req)
  const userProfile = buildUserProfileDto(currentUserId)
  const registrations = db.get('registrations').filter({ userId: currentUserId }).value() || []
  const events = db.get('events').value() || []
  const fanpages = db.get('fanpages').value() || []
  const eventPoints = db.get('event_points').value() || []
  const pointCategories = db.get('point_categories').value() || []
  const criterias = db.get('criterias').value() || []

  // Map backend status -> UI history status
  function mapStatus(backendStatus, ev) {
    if (backendStatus === 'COMPLETED') return 'COMPLETED'
    if (backendStatus === 'CANCELLED') return 'CANCELLED'
    if (backendStatus === 'REJECTED') return 'ABSENT'
    if (backendStatus === 'CHECKED_IN') return 'UPCOMING' // still at event
    // REGISTERED — check if event date is past
    if (ev && ev.dateHappen) {
      const happenDate = new Date(ev.dateHappen)
      if (happenDate < new Date()) return 'ABSENT' // past event, never checked in
    }
    return 'UPCOMING'
  }

  const historyDtos = registrations.map((r) => {
    const ev = events.find((e) => e.id === r.eventId) || {}
    const fp = fanpages.find((f) => f.id === ev.fanpageId)
    const criteria = criterias.find((c) => c.id === ev.criteriaId)

    // Build benefits from event_points
    const evPoints = eventPoints.filter((ep) => ep.eventId === r.eventId)
    const benefits = evPoints.map((ep) => {
      const pc = pointCategories.find((c) => c.id === ep.pointCategoryId)
      const shortName = pc ? pc.note || pc.name : 'ĐRL'
      return `${ep.point}đ ${shortName}`
    })

    // Format date strings for Vietnamese display
    const happenDate = ev.dateHappen ? new Date(ev.dateHappen) : new Date()
    const weekdays = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
    const timeHappen = `${String(happenDate.getHours()).padStart(2,'0')}h${String(happenDate.getMinutes()).padStart(2,'0')}, ${String(happenDate.getDate()).padStart(2,'0')}/${String(happenDate.getMonth()+1).padStart(2,'0')}/${happenDate.getFullYear()}`
    const dateHappen = `${weekdays[happenDate.getDay()]}, ${String(happenDate.getDate()).padStart(2,'0')}/${String(happenDate.getMonth()+1).padStart(2,'0')}/${happenDate.getFullYear()}`

    const uiStatus = mapStatus(r.status, ev)

    return {
      // Backend canonical fields
      eventId: r.eventId,
      regDate: r.regDate,
      checkInAt: r.checkInAt,
      checkOutAt: r.checkOutAt,
      evidenceUrl: r.checkInEvidenceUrl,
      reason: r.reason,
      eventName: ev.name || 'Sự kiện CTU',
      location: ev.location || 'Hội trường Rùa',
      dateOpen: ev.dateOpen,
      dateClose: ev.dateClose,
      bannerUrl: ev.bannerUrl || '',
      // UI RegisteredEventItem fields
      id: `reg-${r.userId}-${r.eventId}`,
      title: ev.name || 'Sự kiện CTU',
      organizer: {
        name: fp ? fp.name : 'Đoàn Trường ĐHCT',
        avatarUrl: fp ? fp.avatarUrl : '',
        isVerified: fp ? fp.status === 'ACTIVE' : false,
      },
      timeHappen,
      dateHappen,
      status: uiStatus,
      attendanceMethod: ev.attendanceMethod || 'STUDENT_PROOF',
      attendanceSessionType: ev.attendanceSessionType || 'BOTH',
      pointsCategory: benefits.length > 0 ? `ĐRL: +${benefits[0]}` : '',
      criteriaSv5t: criteria ? criteria.name : '',
      benefits,
      extraBenefitsCount: Math.max(0, benefits.length - 2),
      capacity: ev.capacity || 100,
      registeredCount: (db.get('registrations').filter({ eventId: r.eventId }).value() || []).length,
      registrationDate: r.regDate,
      attendanceSessions: r.checkInAt ? [
        {
          id: `session-${r.eventId}-1`,
          sessionName: 'Buổi chính',
          checkInTime: r.checkInAt,
          checkedBy: 'Hệ thống tự động',
          status: r.checkOutAt ? 'VALID' : (r.checkInAt ? 'VALID' : 'NOT_STARTED'),
        },
      ] : [
        {
          id: `session-${r.eventId}-1`,
          sessionName: 'Buổi chính',
          status: 'NOT_STARTED',
        },
      ],
      canCancel: uiStatus === 'UPCOMING',
      canRequestAbsence: uiStatus === 'UPCOMING',
      hasProof: Boolean(r.checkInEvidenceUrl),
      studentInfo: {
        mssv: userProfile ? (userProfile.studentId || '') : '',
        fullName: userProfile ? userProfile.name : (r.userId === 1 ? 'Đoàn Tài Lộc' : 'Thành viên'),
      },
    }
  })

  return res.json(successEnvelope(makePageResponse(historyDtos, page, size)))
})

apiRouter.get('/registrations/me/upcoming', (req, res) => {
  const db = getDb()
  const currentUserId = getCurrentUserIdFromRequest(req)
  const registrations = db.get('registrations').filter({ userId: currentUserId, status: 'REGISTERED' }).value() || []
  const events = db.get('events').value() || []

  const dtos = registrations.map((r) => {
    const ev = events.find((e) => e.id === r.eventId) || {}
    return {
      eventId: r.eventId,
      regDate: r.regDate,
      status: r.status,
      eventName: ev.name,
      location: ev.location,
      dateHappen: ev.dateHappen,
      bannerUrl: ev.bannerUrl,
    }
  })
  return res.json(successEnvelope(dtos))
})

apiRouter.patch('/registrations/me/events/:eventId/check-in', (req, res) => {
  const eventId = Number(req.params.eventId)
  const currentUserId = getCurrentUserIdFromRequest(req)
  getDb()
    .get('registrations')
    .find({ userId: currentUserId, eventId })
    .assign({
      status: 'CHECKED_IN',
      checkInAt: new Date().toISOString(),
      checkInEvidenceUrl: req.body.proofUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
    })
    .write()
  return res.json(successEnvelope(null, 'Điểm danh vào thành công'))
})

apiRouter.patch('/registrations/me/events/:eventId/check-out', (req, res) => {
  const eventId = Number(req.params.eventId)
  const currentUserId = getCurrentUserIdFromRequest(req)
  getDb()
    .get('registrations')
    .find({ userId: currentUserId, eventId })
    .assign({
      status: 'COMPLETED',
      checkOutAt: new Date().toISOString(),
      checkOutEvidenceUrl: req.body.proofUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
    })
    .write()
  return res.json(successEnvelope(null, 'Điểm danh ra thành công'))
})

apiRouter.get('/registrations/fanpage-member/fanpages/:fanpageId/events/:eventId/attendees', (req, res) => {
  const eventId = Number(req.params.eventId)
  const registrations = getDb().get('registrations').filter({ eventId }).value() || []
  const users = getDb().get('users').value() || []

  const attendees = registrations.map((r) => {
    const user = users.find((u) => u.id === r.userId) || {}
    return {
      userId: r.userId,
      status: r.status,
      regDate: r.regDate,
      email: user.email || 'student@ctu.edu.vn',
      firstName: user.firstName || 'Tài Lộc',
      lastName: user.lastName || 'Đoàn',
      gender: user.gender || 'MALE',
      avatarUrl: user.avatarUrl,
    }
  })

  return res.json(successEnvelope(attendees))
})

// -------------------------------------------------------------
// 5. Fanpages Endpoints (/api/fanpages)
// -------------------------------------------------------------
apiRouter.get('/fanpages', (req, res) => {
  const { page = 0, size = 10, keyword } = req.query
  let fanpages = getDb().get('fanpages').filter({ status: 'ACTIVE' }).value() || []

  if (keyword) {
    const kw = String(keyword).toLowerCase()
    fanpages = fanpages.filter((f) => f.name.toLowerCase().includes(kw) || f.orgName.toLowerCase().includes(kw))
  }

  return res.json(successEnvelope(makePageResponse(fanpages, page, size)))
})

apiRouter.get('/fanpages/fanpage-admin/my-fanpages', (_req, res) => {
  const fanpages = getDb().get('fanpages').value() || []
  return res.json(successEnvelope(fanpages))
})

apiRouter.get('/fanpages/fanpage-admin/invitations', (_req, res) => {
  const invitations = getDb().get('fanpage_invitations').value() || []
  return res.json(successEnvelope(invitations))
})

apiRouter.patch('/fanpages/fanpage-admin/invitations/:id', (req, res) => {
  const { id } = req.params
  const { status } = req.body || {}
  const invitation = getDb().get('fanpage_invitations').find({ id }).value()
  if (!invitation) {
    return res.status(404).json(errorEnvelope('Không tìm thấy lời mời', 'RESOURCE_NOT_FOUND'))
  }
  getDb().get('fanpage_invitations').find({ id }).assign({ status: status || 'ACCEPTED' }).write()
  return res.json(successEnvelope({ success: true, id, status: status || 'ACCEPTED' }, 'Cập nhật lời mời thành công'))
})

apiRouter.get('/fanpages/:fanpageId', (req, res) => {
  const { fanpageId } = req.params
  const fanpage = getDb().get('fanpages').find({ id: Number(fanpageId) }).value()
  if (!fanpage) {
    return res.status(404).json(errorEnvelope('Không tìm thấy fanpage', 'RESOURCE_NOT_FOUND'))
  }
  const realEventsCount = (getDb().get('events').filter({ fanpageId: Number(fanpageId) }).value() || []).length
  const dto = {
    ...fanpage,
    followerCount: fanpage.followersCount ?? fanpage.followerCount ?? 0,
    eventCount: realEventsCount,
    email: fanpage.helpContact ?? fanpage.email ?? '',
    phone: fanpage.helpPhone ?? fanpage.phone ?? '',
    description: fanpage.description ?? '',
    isFollowing: true,
  }
  return res.json(successEnvelope(dto))
})

apiRouter.get('/fanpages/:fanpageId/events', (req, res) => {
  const { fanpageId } = req.params
  const { page = 0, size = 10 } = req.query
  const currentUserId = getCurrentUserIdFromRequest(req) || 1
  const events = getDb().get('events').filter({ fanpageId: Number(fanpageId) }).value() || []
  const fanpage = getDb().get('fanpages').find({ id: Number(fanpageId) }).value()
  const dtos = events.map((ev) => {
    const base = buildEventResponseDto(ev, currentUserId)
    return {
      ...base,
      eventId: String(ev.id),
      title: ev.name,
      location: typeof ev.location === 'string' ? ev.location : (ev.location?.address || 'Đại học Cần Thơ'),
      authorName: fanpage ? fanpage.name : 'Ban Tổ Chức',
      authorAvatarUrl: fanpage ? fanpage.avatarUrl : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120',
      timeAgo: '1 ngày trước',
      benefits: base.pointsReward || 'Cộng điểm rèn luyện',
      capacityText: `${ev.capacity || 100} sinh viên`,
      commentsCount: 12,
      sharesCount: 5,
    }
  })
  return res.json(successEnvelope(makePageResponse(dtos, page, size)))
})

apiRouter.get('/fanpages/:fanpageId/members', (_req, res) => {
  const memberDto = [
    {
      userId: 2,
      email: 'organizer@ctu.edu.vn',
      firstName: 'Minh Anh',
      lastName: 'Nguyễn',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      role: 'ADMIN',
    },
  ]
  return res.json(successEnvelope(memberDto))
})

apiRouter.get('/fanpages/:fanpageId/activity-stats', (req, res) => {
  const { fanpageId } = req.params
  const stats = getDb().get('fanpage_statistics').find({ fanpageId: Number(fanpageId) }).value()
  if (stats) {
    return res.json(successEnvelope(stats))
  }
  const events = getDb().get('events').filter({ fanpageId: Number(fanpageId) }).value() || []
  return res.json(successEnvelope({
    periodLabel: '7 ngày gần nhất',
    eventsCount: events.length,
    interactionsCount: 120,
    newFollowersCount: 15,
    responseRatePercent: 95,
    pendingCommentsCount: 0,
  }))
})

apiRouter.get('/fanpages/:fanpageId/upcoming-reminder', (req, res) => {
  const { fanpageId } = req.params
  const events = getDb().get('events').filter({ fanpageId: Number(fanpageId) }).value() || []
  const now = new Date().toISOString()
  const upcoming = events.find((e) => e.dateHappen >= now) || events[0]
  if (!upcoming) {
    return res.json(successEnvelope(null))
  }
  const happen = new Date(upcoming.dateHappen)
  const monthText = `TH${happen.getMonth() + 1}`
  const dayText = String(happen.getDate()).padStart(2, '0')
  const dateText = `${dayText}/${String(happen.getMonth() + 1).padStart(2, '0')}/${happen.getFullYear()}`
  const registrations = (getDb().get('registrations').filter({ eventId: upcoming.id }).value() || []).length
  return res.json(successEnvelope({
    id: String(upcoming.id),
    title: upcoming.name,
    monthText,
    dayText,
    registrationsCount: registrations || upcoming.capacity || 100,
    dateText,
  }))
})

// -------------------------------------------------------------
// 6. Semesters & Academic Years (/api/semesters & /api/academic-years)
// -------------------------------------------------------------
apiRouter.get('/semesters', (_req, res) => {
  const semesters = getDb().get('semesters').value() || []
  return res.json(successEnvelope(semesters))
})

apiRouter.get('/semesters/current', (_req, res) => {
  const semester = getDb().get('semesters').find({ status: 'ACTIVE' }).value()
  return res.json(successEnvelope(semester))
})

apiRouter.get('/semesters/:id', (req, res) => {
  const semester = getDb().get('semesters').find({ id: Number(req.params.id) }).value()
  return res.json(successEnvelope(semester))
})

apiRouter.get('/academic-years', (_req, res) => {
  const years = getDb().get('academic_years').value() || []
  return res.json(successEnvelope(years))
})

apiRouter.get('/academic-years/current', (_req, res) => {
  const year = getDb().get('academic_years').find({ id: 2 }).value()
  return res.json(successEnvelope(year))
})

// -------------------------------------------------------------
// 7. Training Point Categories & Criteria (/api/point-categories & /api/criterias)
// -------------------------------------------------------------
apiRouter.get('/point-categories', (_req, res) => {
  const categories = getDb().get('point_categories').value() || []
  return res.json(successEnvelope(categories))
})

apiRouter.get('/point-categories/:id', (req, res) => {
  const category = getDb().get('point_categories').find({ id: Number(req.params.id) }).value()
  return res.json(successEnvelope(category))
})

apiRouter.get('/criterias', (_req, res) => {
  const criterias = getDb().get('criterias').value() || []
  return res.json(successEnvelope(criterias))
})

apiRouter.get('/criterias/:id', (req, res) => {
  const criteria = getDb().get('criterias').find({ id: Number(req.params.id) }).value()
  return res.json(successEnvelope(criteria))
})

// -------------------------------------------------------------
// 8. Student Progress & Point Aggregates (/api/student & /api/student-semester-points)
// -------------------------------------------------------------
apiRouter.get('/student/criteria-progress', (req, res) => {
  const currentUserId = getCurrentUserIdFromRequest(req)
  const academicYearId = Number(req.query.academicYearId) || 2
  const allCriterias = getDb().get('criterias').value() || []
  const allProgress = getDb().get('student_criteria_progress').value() || []
  const progressList = allProgress.filter(
    (p) => (p.userId === currentUserId || p.userId === 1) && (p.academicYearId === academicYearId || !p.academicYearId)
  )

  const progressMap = new Map()
  progressList.forEach((p) => {
    progressMap.set(p.criteriaId, p)
  })

  // Build recursive node
  function buildNode(c) {
    const directChildren = allCriterias
      .filter((child) => child.parentId === c.id)
      .sort((a, b) => a.childrenOrder - b.childrenOrder)
      .map(buildNode)

    const isLeaf = directChildren.length === 0
    let isCompleted = false
    let completionSource = null
    let completedAt = null
    let note = c.note || null

    if (isLeaf) {
      const p = progressMap.get(c.id)
      if (p) {
        isCompleted = true
        completionSource = p.completionSource || 'MANUAL'
        completedAt = p.createdAt || '2026-08-15T14:00:00Z'
        if (p.note) note = p.note
      }
    } else {
      // Group evaluation logic
      if (c.id === 103) {
        // 1.3 requires at least 1 of 5
        const doneCount = directChildren.filter((ch) => ch.isCompleted).length
        isCompleted = doneCount >= 1
      } else if (c.id === 10) {
        // Standard 1 requires 101, 102, 103 (all 3)
        isCompleted = directChildren.length > 0 && directChildren.every((ch) => ch.isCompleted)
      } else if (c.id === 20) {
        // Standard 2 requires 201, 202
        isCompleted = directChildren.length > 0 && directChildren.every((ch) => ch.isCompleted)
      } else if (c.id === 30 || c.id === 40) {
        // Standard 3 & 4 require at least 1
        isCompleted = directChildren.some((ch) => ch.isCompleted)
      } else if (c.id === 50) {
        // Standard 5 requires at least 2 of 3 (501, 502, 503)
        const done = directChildren.filter((ch) => ch.isCompleted).length
        isCompleted = done >= 2
      } else if (c.id === 501 || c.id === 502 || c.id === 503) {
        // Sub standards in 5 require at least 1 child
        isCompleted = directChildren.some((ch) => ch.isCompleted)
      } else {
        isCompleted = directChildren.length > 0 && directChildren.every((ch) => ch.isCompleted)
      }
    }

    const completedChildren = directChildren.filter((ch) => ch.isCompleted).length
    let requiredChildren = null
    if (c.id === 10) requiredChildren = 3
    else if (c.id === 20) requiredChildren = 2
    else if (c.id === 30) requiredChildren = 1
    else if (c.id === 40) requiredChildren = 1
    else if (c.id === 50) requiredChildren = 2
    else if (c.id === 103) requiredChildren = 1
    else if (c.id === 501 || c.id === 502 || c.id === 503) requiredChildren = 1
    else if (directChildren.length > 0) requiredChildren = directChildren.length

    return {
      criteriaId: c.id,
      name: c.name,
      note,
      scope: c.scope,
      level: c.level,
      childrenOrder: c.childrenOrder,
      requiredChildren,
      isCompleted,
      completedChildren,
      totalChildren: directChildren.length,
      completionSource,
      completedAt,
      children: directChildren,
    }
  }

  // Level 1 main standards (10, 20, 30, 40, 50)
  const rootStandards = allCriterias
    .filter((c) => c.level === 1)
    .sort((a, b) => a.childrenOrder - b.childrenOrder)
    .map(buildNode)

  const completedMain = rootStandards.filter((s) => s.isCompleted).length

  // Count total and completed leaves
  let totalLeaves = 0
  let completedLeaves = 0
  function countLeaves(node) {
    if (node.children.length === 0) {
      totalLeaves++
      if (node.isCompleted) completedLeaves++
      return
    }
    node.children.forEach(countLeaves)
  }
  rootStandards.forEach(countLeaves)

  const academicYearObj = getDb().get('academic_years').find({ id: academicYearId }).value()
  const academicYearLabel = academicYearObj ? academicYearObj.code : '2026 - 2027'

  const progressDto = {
    academicYearId,
    academicYear: academicYearLabel,
    completedLeafCriteria: completedLeaves,
    totalLeafCriteria: totalLeaves,
    completedMainCriteria: completedMain,
    totalMainCriteria: rootStandards.length,
    criteria: rootStandards,
  }

  return res.json(successEnvelope(progressDto))
})

apiRouter.patch('/student/criteria/:criteriaId/progress', (req, res) => {
  const currentUserId = getCurrentUserIdFromRequest(req)
  const criteriaId = Number(req.params.criteriaId)
  const { academicYearId, completed, note } = req.body

  const db = getDb()
  const existing = db.get('student_criteria_progress').find({
    userId: currentUserId,
    criteriaId,
    academicYearId: Number(academicYearId) || 2,
  }).value()

  if (completed) {
    if (existing) {
      db.get('student_criteria_progress')
        .find({ id: existing.id })
        .assign({
          completionSource: 'MANUAL',
          note: note !== undefined ? note : existing.note,
          updatedAt: new Date().toISOString(),
        })
        .write()
    } else {
      const nextId = (db.get('student_criteria_progress').map('id').value().sort((a, b) => b - a)[0] || 0) + 1
      db.get('student_criteria_progress').push({
        id: nextId,
        userId: currentUserId,
        criteriaId,
        academicYearId: Number(academicYearId) || 2,
        eventId: null,
        completionSource: 'MANUAL',
        note: note || 'Sinh viên tự đánh giá đạt tiêu chuẩn',
        isActive: true,
        createdAt: new Date().toISOString(),
      }).write()
    }
  } else {
    if (existing) {
      db.get('student_criteria_progress').remove({ id: existing.id }).write()
    }
  }

  return res.json(successEnvelope(null, 'Cập nhật tiến độ tiêu chí thành công'))
})

apiRouter.get('/student-semester-points/me/semesters/:semesterId', (req, res) => {
  const currentUserId = getCurrentUserIdFromRequest(req)
  const semId = Number(req.params.semesterId) || 1
  const allPts = getDb().get('student_semester_points').value() || []
  let points = allPts.filter((p) => (p.userId === currentUserId || p.userId === 1) && (p.semesterId === semId || !p.semesterId))
  if (points.length === 0) {
    points = allPts.filter((p) => p.semesterId === semId || !p.semesterId)
  }
  return res.json(successEnvelope(points))
})

apiRouter.get('/point-transactions/me/semesters/:semesterId/point-categories/:pointCategoryId', (req, res) => {
  const currentUserId = getCurrentUserIdFromRequest(req)
  const semId = Number(req.params.semesterId) || 1
  const catId = Number(req.params.pointCategoryId)
  const allTx = getDb().get('point_transactions').value() || []
  const tx = allTx.filter((t) =>
    (t.userId === currentUserId || t.userId === 1) &&
    (t.semesterId === semId || !t.semesterId) &&
    t.pointCategoryId === catId
  )
  return res.json(successEnvelope(tx))
})

apiRouter.get('/point-transactions/me/semesters/:semesterId', (req, res) => {
  const currentUserId = getCurrentUserIdFromRequest(req)
  const semId = Number(req.params.semesterId) || 1
  const allTx = getDb().get('point_transactions').value() || []
  const semTx = allTx.filter((t) => t.semesterId === semId || !t.semesterId)

  if (currentUserId === 1) {
    const tx = semTx.filter((t) => t.userId === 1)
    return res.json(successEnvelope(tx))
  }

  // Overlay user's personal manual changes on top of default seed records
  const userTx = semTx.filter((t) => t.userId === currentUserId)
  const userCatKeys = new Set(userTx.map((t) => `${t.pointCategoryId}-${t.type}`))
  const defaultTx = semTx.filter((t) => t.userId === 1 && !userCatKeys.has(`${t.pointCategoryId}-${t.type}`))

  return res.json(successEnvelope([...defaultTx, ...userTx]))
})

apiRouter.post('/point-transactions/me', (req, res) => {
  const currentUserId = getCurrentUserIdFromRequest(req)
  const { semesterId, pointCategoryId, points, description } = req.body

  const db = getDb()
  const existing = db.get('point_transactions').find({
    userId: currentUserId,
    semesterId: Number(semesterId),
    pointCategoryId: Number(pointCategoryId),
    type: 'MANUAL',
  }).value()

  if (existing) {
    db.get('point_transactions')
      .find({ id: existing.id })
      .assign({ points: Number(points), description: description || existing.description, updatedAt: new Date().toISOString() })
      .write()
  } else {
    const nextId = (db.get('point_transactions').map('id').value().sort((a, b) => b - a)[0] || 0) + 1
    db.get('point_transactions').push({
      id: nextId,
      userId: currentUserId,
      semesterId: Number(semesterId),
      pointCategoryId: Number(pointCategoryId),
      eventId: null,
      points: Number(points),
      type: 'MANUAL',
      status: 'CONFIRMED',
      description: description || 'Sinh viên tự đánh giá',
      createdAt: new Date().toISOString(),
    }).write()
  }

  return res.json(successEnvelope(null, 'Lưu điểm tự đánh giá thành công'))
})

// -------------------------------------------------------------
// 9. Master Data Taxonomy (/api/schools, /api/majors, /api/associations, /api/event-types)
// -------------------------------------------------------------
apiRouter.get('/schools', (_req, res) => res.json(successEnvelope(getDb().get('schools').value() || [])))
apiRouter.get('/majors', (_req, res) => res.json(successEnvelope(getDb().get('majors').value() || [])))
apiRouter.get('/associations', (_req, res) => res.json(successEnvelope(getDb().get('associations').value() || [])))
apiRouter.get('/event-types', (_req, res) => res.json(successEnvelope(getDb().get('event_types').value() || [])))

// -------------------------------------------------------------
// 10. Backward Compatibility Aliases for Frontend Prototype Components
// -------------------------------------------------------------
apiRouter.post('/events/:id/register', (req, res) => {
  const eventId = Number(req.params.id) || 1
  const newReg = {
    userId: 1,
    eventId,
    regDate: new Date().toISOString(),
    status: 'REGISTERED',
  }
  getDb().get('registrations').push(newReg).write()
  return res.json(successEnvelope(newReg, 'Đăng ký sự kiện thành công'))
})

apiRouter.post('/checkin/photo-verify', (req, res) => {
  return res.json(
    successEnvelope({
      registrationId: req.body.registrationId || 'reg-2',
      status: 'CHECKED_IN',
      verifiedAt: new Date().toISOString(),
      confidenceScore: 0.98,
      message: 'Xác thực khuôn mặt thành công (độ chính xác 98%).',
    }, 'Điểm danh thành công')
  )
})

apiRouter.get('/certificates/:registrationId', (req, res) => {
  const { registrationId } = req.params
  const db = getDb()
  // registrationId can be "reg-1-1" or "1" or numeric
  const parts = String(registrationId).split('-')
  const eventId = parts.length >= 3 ? Number(parts[2]) : Number(registrationId) || 1
  const event = db.get('events').find({ id: eventId }).value() || db.get('events').find({ id: 1 }).value()

  return res.json(
    successEnvelope({
      id: `cert-${registrationId}`,
      registrationId: String(registrationId),
      eventId: String(event ? event.id : 1),
      attendeeName: 'Đoàn Tài Lộc',
      studentId: 'B2303827',
      eventTitle: event ? event.name : 'Hội thảo chuyên đề: Trí tuệ nhân tạo & Xu hướng mô hình ngôn ngữ lớn (LLM)',
      issueDate: event && event.dateHappen ? event.dateHappen.substring(0, 10) : '2026-08-16',
      verificationCode: `CTU-CERT-${eventId}-883921`,
      downloadUrl: `/api/certificates/cert-${registrationId}/download`,
    })
  )
})

apiRouter.get('/certificates/:id/download', (_req, res) => {
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'attachment; filename="certificate.pdf"')
  const pdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Certificate) /Author (CTU) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF')
  return res.send(pdfBuffer)
})

apiRouter.get('/moderation/queue', (_req, res) => {
  return res.json(
    successEnvelope([
      {
        id: '1',
        name: 'Đoàn Tài Lộc',
        email: 'student@ctu.edu.vn',
        eventTitle: 'Ngày hội việc làm và kết nối doanh nghiệp CNTT 2026',
        step: 'STAGE_1_REVIEW',
      },
    ])
  )
})

// Event registration endpoints
apiRouter.post('/events/:id/register', (req, res) => {
  const { id } = req.params
  if (id === 'fail' || id === '999999') {
    return res.status(400).json(errorEnvelope('Sự kiện đã hết số lượng đăng ký hoặc đã đóng lượt tham gia.'))
  }
  const eventId = Number(id)
  const currentUserId = getCurrentUserIdFromRequest(req) || 1
  const result = registerEventInDb(currentUserId, eventId)
  return res.json(
    successEnvelope({
      id: `reg-${id}`,
      eventId,
      registeredAt: result.registration.regDate,
      status: 'CONFIRMED',
    }, 'Đăng ký tham gia sự kiện thành công')
  )
})

apiRouter.patch('/registrations/me/events/:id/cancel', (req, res) => {
  const { id } = req.params
  const eventId = Number(id)
  const currentUserId = getCurrentUserIdFromRequest(req) || 1
  cancelEventInDb(currentUserId, eventId, req.body?.reason)
  return res.json(successEnvelope({ cancelled: true, eventId }, 'Hủy đăng ký thành công'))
})

// Mount apiRouter on /api
server.use('/api', apiRouter)

// Fallback to JSON Server router for raw collections
server.use('/api', router)

const PORT = process.env.PORT || 8088
server.listen(PORT, () => {
  console.info(`🚀 Mock API Server running at http://localhost:${PORT}/api`)
})
