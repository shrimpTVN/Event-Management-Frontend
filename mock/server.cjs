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

function buildStudentProfileDto(userId) {
  const db = getDb()
  const user = db.get('users').find({ id: Number(userId) }).value()
  if (!user) return null

  const profile = db.get('student_profiles').find({ userId: user.id }).value()
  const major = profile ? db.get('majors').find({ id: profile.majorId }).value() : null
  const school = major ? db.get('schools').find({ id: major.schoolId }).value() : null
  const association = profile ? db.get('associations').find({ id: profile.associationId }).value() : null
  const roleName = resolveUserRole(user.id)

  return {
    id: String(user.id),
    email: user.email,
    role: roleName,
    isActive: user.isActive,
    firstName: user.firstName,
    lastName: user.lastName,
    name: `${user.lastName} ${user.firstName}`.trim(),
    studentId: profile ? profile.studentId : 'B2303827',
    gender: user.gender,
    kNumber: profile ? String(profile.kNumber) : '49',
    avatarUrl: user.avatarUrl,
    associationName: association ? association.name : 'Đoàn Trường Đại học Cần Thơ',
    majorName: major ? major.name : 'Kỹ thuật phần mềm',
    majorCode: major ? major.code : '7480103',
    schoolName: school ? school.name : 'Trường Công nghệ Thông tin và Truyền thông',
    isProfileComplete: true,
  }
}

function buildEventResponseDto(event) {
  const db = getDb()
  const eventType = db.get('event_types').find({ id: event.eventTypeId }).value()
  const criteria = db.get('criterias').find({ id: event.criteriaId }).value()
  const fanpage = db.get('fanpages').find({ id: event.fanpageId }).value()
  const semester = db.get('semesters').find({ id: event.semesterId }).value()
  const eventPoints = db.get('event_points').filter({ eventId: event.id }).value() || []
  const pointCategories = db.get('point_categories').value() || []
  const registrations = db.get('registrations').filter({ eventId: event.id }).value() || []

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
  const token = 'mock-jwt-token-' + Date.now()

  res.cookie('ddd_jwt', token, {
    httpOnly: true,
    maxAge: 86400000,
    sameSite: 'lax',
    path: '/',
  })
  res.cookie('ddd_refresh', 'mock-refresh-' + Date.now(), {
    httpOnly: true,
    maxAge: 604800000,
    sameSite: 'lax',
    path: '/',
  })

  const fullUserProfile = buildStudentProfileDto(user.id)

  return res.json(
    successEnvelope({
      userId: user.id,
      email: user.email,
      role: roleName,
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

apiRouter.get('/auth/me', (_req, res) => {
  const profile = buildStudentProfileDto(1)
  return res.json(successEnvelope(profile))
})

apiRouter.post('/auth/student-profile', (req, res) => {
  const profile = { ...buildStudentProfileDto(1), ...req.body, isProfileComplete: true }
  return res.json(successEnvelope(profile, 'Cập nhật hồ sơ sinh viên thành công'))
})

apiRouter.post('/auth/staff-profile', (req, res) => {
  const profile = { ...buildStudentProfileDto(2), ...req.body, isProfileComplete: true }
  return res.json(successEnvelope(profile, 'Cập nhật hồ sơ cán bộ thành công'))
})

// -------------------------------------------------------------
// 2. Users & Profiles Endpoints (/api/users)
// -------------------------------------------------------------
apiRouter.get('/users/me/profile', (_req, res) => {
  const profile = buildStudentProfileDto(1)
  return res.json(successEnvelope(profile))
})

apiRouter.put('/users/me/profile', (req, res) => {
  const profile = { ...buildStudentProfileDto(1), ...req.body }
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
  const { keyword, eventTypeId, fanpageId, page = 0, size = 10 } = req.query
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

  const dtos = events.map(buildEventResponseDto)
  return res.json(successEnvelope(makePageResponse(dtos, page, size)))
})

apiRouter.get('/events/fanpage/:fanpageId', (req, res) => {
  const { fanpageId } = req.params
  const { page = 0, size = 10 } = req.query
  const events = getDb().get('events').filter({ fanpageId: Number(fanpageId) }).value() || []
  const dtos = events.map(buildEventResponseDto)
  return res.json(successEnvelope(makePageResponse(dtos, page, size)))
})

apiRouter.get('/events/:id', (req, res) => {
  const { id } = req.params
  const event = getDb().get('events').find({ id: Number(id) }).value()
  if (!event) {
    return res.status(404).json(errorEnvelope('Không tìm thấy sự kiện', 'RESOURCE_NOT_FOUND'))
  }
  return res.json(successEnvelope(buildEventResponseDto(event)))
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

apiRouter.patch('/events/fanpage-member/:id/status', (req, res) => {
  const { id } = req.params
  const { status } = req.query
  const db = getDb()
  const event = db.get('events').find({ id: Number(id) }).assign({ status, updatedAt: new Date().toISOString() }).write()
  return res.json(successEnvelope(event, 'Đổi trạng thái sự kiện thành công'))
})

apiRouter.delete('/events/fanpage-member/:id', (req, res) => {
  getDb().get('events').remove({ id: Number(req.params.id) }).write()
  return res.json(successEnvelope(null, 'Xóa sự kiện thành công'))
})

// -------------------------------------------------------------
// 4. Registrations & Attendance Endpoints (/api/registrations)
// -------------------------------------------------------------
apiRouter.post('/registrations/me/events/:eventId', (req, res) => {
  const eventId = Number(req.params.eventId)
  const db = getDb()
  const existing = db.get('registrations').find({ userId: 1, eventId }).value()
  if (existing) {
    return res.status(409).json(errorEnvelope('Sinh viên đã đăng ký sự kiện này rồi', 'DUPLICATE_RESOURCE_ERROR'))
  }

  const newReg = {
    userId: 1,
    eventId,
    regDate: new Date().toISOString(),
    checkInAt: null,
    checkInEvidenceUrl: null,
    checkOutAt: null,
    checkOutEvidenceUrl: null,
    status: 'REGISTERED',
    reason: null,
  }

  db.get('registrations').push(newReg).write()
  return res.json(successEnvelope(null, 'Đăng ký tham gia sự kiện thành công'))
})

apiRouter.patch('/registrations/me/events/:eventId/cancel', (req, res) => {
  const eventId = Number(req.params.eventId)
  getDb()
    .get('registrations')
    .find({ userId: 1, eventId })
    .assign({ status: 'CANCELLED', reason: req.body.reason || 'Hủy đăng ký' })
    .write()
  return res.json(successEnvelope(null, 'Hủy đăng ký thành công'))
})

apiRouter.get('/registrations/me/history', (req, res) => {
  const { page = 0, size = 10 } = req.query
  const db = getDb()
  const registrations = db.get('registrations').filter({ userId: 1 }).value() || []
  const events = db.get('events').value() || []

  const historyDtos = registrations.map((r) => {
    const ev = events.find((e) => e.id === r.eventId) || {}
    return {
      eventId: r.eventId,
      regDate: r.regDate,
      status: r.status,
      reason: r.reason,
      checkInAt: r.checkInAt,
      checkOutAt: r.checkOutAt,
      evidenceUrl: r.checkInEvidenceUrl,
      eventName: ev.name || 'Sự kiện CTU',
      location: ev.location || 'Hội trường Rùa',
      dateOpen: ev.dateOpen || '2026-09-01T00:00:00Z',
      dateClose: ev.dateClose || '2026-09-20T00:00:00Z',
      dateHappen: ev.dateHappen || '2026-09-22T18:00:00Z',
      bannerUrl: ev.bannerUrl || '',
    }
  })

  return res.json(successEnvelope(makePageResponse(historyDtos, page, size)))
})

apiRouter.get('/registrations/me/upcoming', (_req, res) => {
  const db = getDb()
  const registrations = db.get('registrations').filter({ userId: 1, status: 'REGISTERED' }).value() || []
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
  getDb()
    .get('registrations')
    .find({ userId: 1, eventId })
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
  getDb()
    .get('registrations')
    .find({ userId: 1, eventId })
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

apiRouter.get('/fanpages/:fanpageId', (req, res) => {
  const { fanpageId } = req.params
  const fanpage = getDb().get('fanpages').find({ id: Number(fanpageId) }).value()
  if (!fanpage) {
    return res.status(404).json(errorEnvelope('Không tìm thấy fanpage', 'RESOURCE_NOT_FOUND'))
  }
  return res.json(successEnvelope(fanpage))
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
apiRouter.get('/student/criteria-progress', (_req, res) => {
  const criterias = getDb().get('criterias').filter({ level: 1 }).value() || []
  const progressList = getDb().get('student_criteria_progress').filter({ userId: 1 }).value() || []

  const tree = criterias.map((c) => {
    const isCompleted = progressList.some((p) => p.criteriaId === c.id)
    return {
      criteriaId: c.id,
      name: c.name,
      note: c.note,
      scope: c.scope,
      level: c.level,
      childrenOrder: c.childrenOrder,
      requiredChildren: null,
      isCompleted,
      completedChildren: isCompleted ? 1 : 0,
      totalChildren: 1,
      completionSource: isCompleted ? 'EVENT_CHECKOUT' : null,
      completedAt: isCompleted ? '2026-08-15T14:00:00Z' : null,
      children: [],
    }
  })

  const progressDto = {
    academicYearId: 2,
    academicYear: '2026-2027',
    completedLeafCriteria: 2,
    totalLeafCriteria: 5,
    completedMainCriteria: 2,
    totalMainCriteria: 5,
    criteria: tree,
  }

  return res.json(successEnvelope(progressDto))
})

apiRouter.get('/student-semester-points/me/semesters/:semesterId', (req, res) => {
  const points = getDb().get('student_semester_points').filter({ userId: 1, semesterId: Number(req.params.semesterId) }).value() || []
  return res.json(successEnvelope(points))
})

apiRouter.get('/point-transactions/me/semesters/:semesterId/point-categories/:pointCategoryId', (req, res) => {
  const tx = getDb().get('point_transactions').filter({
    userId: 1,
    semesterId: Number(req.params.semesterId),
    pointCategoryId: Number(req.params.pointCategoryId),
  }).value() || []
  return res.json(successEnvelope(tx))
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

apiRouter.get('/certificates/:registrationId', (_req, res) => {
  return res.json(
    successEnvelope({
      id: 'cert-1',
      registrationId: 'reg-3',
      eventId: '4',
      attendeeName: 'Đoàn Tài Lộc',
      eventTitle: 'HỘI THẢO CHUYÊN ĐỀ: TRÍ TUỆ NHÂN TẠO & XU HƯỚNG MÔ HÌNH NGÔN NGỮ LỚN (LLM)',
      issueDate: '2026-08-16',
      verificationCode: 'CTU-AI-883921',
      downloadUrl: '/api/certificates/cert-1/download',
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
        eventTitle: 'NGÀY HỘI VIỆC LÀM VÀ KẾT NỐI DOANH NGHIỆP CNTT 2026',
        step: 'STAGE_1_REVIEW',
      },
    ])
  )
})

// Mount apiRouter on /api
server.use('/api', apiRouter)

// Fallback to JSON Server router for raw collections
server.use('/api', router)

const PORT = 8080
server.listen(PORT, () => {
  console.info(`🚀 Mock API Server running at http://localhost:${PORT}/api`)
})
