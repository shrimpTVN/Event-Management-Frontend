import { beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('@/shared', () => ({ apiClient: { get: vi.fn(), patch: vi.fn() } }))
import { apiClient } from '@/shared'
import {
  buildAdminBenefitLookups,
  mapAdminEvent,
  mapAdminFanpage,
  mapAdminUser,
  getSuperAdminRoles,
  getUserDisplayRole,
  normalizeAdminRole,
  superAdminService,
} from '../superAdminService'
const get = vi.mocked(apiClient.get)

describe('superadmin API data', () => {
  beforeEach(() => vi.clearAllMocks())
  it('reads the actual profile code and never derives one from an email', () => {
    const user = { userId: 7, email: 'different-name@student.ctu.edu.vn', roles: ['STUDENT'] }
    expect(
      mapAdminUser(user, {
        email: user.email,
        studentId: 'B2300123',
        schoolName: 'Khoa A',
        majorName: 'Ngành B',
      })
    ).toMatchObject({ code: 'B2300123', schoolName: 'Khoa A', majorName: 'Ngành B' })
    expect(mapAdminUser(user)).toMatchObject({
      code: '',
      schoolName: '',
      majorName: '',
      createdAt: '',
      eventsParticipatedCount: null,
    })
  })
  it('uses the three UI roles and gives admin precedence over unordered roles', () => {
    expect(normalizeAdminRole({ roles: ['STUDENT', 'FANPAGE_ADMIN', 'ADMIN'] })).toBe('SUPERADMIN')
    expect(normalizeAdminRole({ roles: ['ROLE_FANPAGE_ADMIN'] })).toBe('STAFF')
    expect(normalizeAdminRole({ role: 'STUDENT' })).toBe('STUDENT')
  })
  it('loads all user pages, both active states and profiles, joining by email', async () => {
    get.mockImplementation(async (url, config) => {
      const { page, isActive } = (config?.params ?? {}) as { page: number; isActive: boolean }
      if (url === '/users/admin/profiles')
        return {
          content: isActive
            ? [{ email: 'a@ctu.edu.vn', studentId: 'B123' }]
            : [{ email: 'b@ctu.edu.vn', studentId: 'B456' }],
          last: true,
        }
      if (!isActive)
        return { content: [{ userId: 2, email: 'b@ctu.edu.vn', isActive: false }], last: true }
      return {
        content:
          page === 0
            ? Array.from({ length: 100 }, (_, i) => ({
                userId: i + 10,
                email: i === 0 ? 'a@ctu.edu.vn' : `u${i}@ctu.edu.vn`,
              }))
            : [{ userId: 200, email: 'last@ctu.edu.vn' }],
        totalPages: 2,
        last: page === 1,
      }
    })
    const result = await superAdminService.getUsers({ size: 500 })
    expect(result.content).toHaveLength(102)
    expect(result.content.find((u) => u.email === 'a@ctu.edu.vn')?.code).toBe('B123')
    expect(result.content.find((u) => u.id === '2')).toMatchObject({
      code: 'B456',
      status: 'LOCKED',
    })
  })
  it('preserves zero and distinguishes unavailable registrations from zero', () => {
    expect(mapAdminEvent({ id: 1, capacity: 0, registeredCount: 0 })).toMatchObject({
      capacity: 0,
      registeredCount: 0,
      trainingPoint: 0,
    })
    expect(mapAdminEvent({ id: 1 })).toMatchObject({
      capacity: null,
      registeredCount: null,
      location: '',
      trainingPoint: 0,
    })
  })
  it('maps every API benefit rather than inserting default points', () => {
    const event = mapAdminEvent(
      {
        id: 1,
        eventPoints: [
          { pointCategoryId: 2, point: 3 },
          { pointCategoryId: 4, point: 0 },
        ],
        criteriaName: 'Tình nguyện tốt',
      },
      new Map([
        [2, 'Mục học tập'],
        [4, 'Mục tình nguyện'],
      ])
    )
    expect(event.trainingPoint).toBe(3)
    expect(event.eventPoints).toEqual([
      { pointCategoryId: 2, name: 'Mục học tập', point: 3 },
      { pointCategoryId: 4, name: 'Mục tình nguyện', point: 0 },
    ])
    expect(event.sv5tCriteriaName).toBe('Tình nguyện tốt')
  })
  it('keeps drafts, cancellations and inactive events distinct', () => {
    expect(mapAdminEvent({ id: 1, status: 'DRAFT' }).status).toBe('DRAFT')
    expect(mapAdminEvent({ id: 1, status: 'CANCELLED' }).status).toBe('CANCELLED')
    expect(mapAdminEvent({ id: 1, status: 'PUBLISHED', isActive: false }).status).toBe('HIDDEN')
  })
  it('formats point codes and SV5T parent groups from the API hierarchy', () => {
    const { names, codes, formatCriteria } = buildAdminBenefitLookups(
      [
        { id: 4, name: 'Chi tiết mục IV', childrenOrder: 4 },
        { id: 1, name: 'Mục I', childrenOrder: 1 },
        { id: 3, name: 'Mục III', childrenOrder: 3 },
        { id: 2, name: 'Mục II', childrenOrder: 2 },
        { id: 41, name: 'Mô tả đầy đủ mục IV.b', parentCategoryId: 4, childrenOrder: 2 },
        { id: 40, name: 'Mục IV.a', parentCategoryId: 4, childrenOrder: 1 },
      ],
      [
        {
          id: 7,
          name: 'Tình nguyện tốt',
          children: [{ id: 8, name: 'Hiến máu tình nguyện', parentId: 7 }],
        },
      ]
    )
    const result = mapAdminEvent(
      {
        id: 10,
        registeredCount: 245,
        capacity: 500,
        criteriaId: 8,
        eventPoints: [{ pointCategoryId: 41, point: 10 }],
      },
      names,
      codes,
      formatCriteria
    )
    expect(result).toMatchObject({
      registeredCount: 245,
      capacity: 500,
      sv5tCriteriaName: 'Tình nguyện tốt (Hiến máu tình nguyện)',
      eventPoints: [{ code: 'IV.b', point: 10 }],
    })
  })
  it('resolves SV5T by child name without a criteria ID and omits intermediate requirements', async () => {
    const child = 'Tham gia hoạt động giáo dục đạo đức, lối sống văn hóa cho sinh viên'
    get.mockImplementation(async (url) => {
      if (url === '/point-categories') return []
      if (url === '/criterias')
        return [
          { id: 1, name: 'Tiêu chuẩn Đạo đức tốt' },
          { id: 2, name: 'Đạt thêm 01 trong 05 tiêu chí', parentId: 1 },
          { id: 3, name: child, parentId: 2 },
        ]
      return { content: [{ id: 10, criteriaName: child }], last: true }
    })
    const result = await superAdminService.getEvents()
    expect(result.content[0].sv5tCriteriaName).toBe(`Tiêu chuẩn Đạo đức tốt (${child})`)
  })

  it('requests every backend event status and active state', async () => {
    get.mockImplementation(async (url, config) => {
      if (url === '/point-categories' || url === '/criterias') return []
      return {
        content: [
          {
            id: `${(config?.params as any).status}-${(config?.params as any).isActive}`,
            status: (config?.params as any).status,
            isActive: (config?.params as any).isActive,
          },
        ],
        last: true,
      }
    })
    const result = await superAdminService.getEvents()
    expect(result.content).toHaveLength(8)
    expect(get.mock.calls.filter(([url]) => url === '/events/admin')).toHaveLength(8)
    expect(result.content.every((event) => event.registeredCount === null)).toBe(true)
  })
  it('passes backend role names when changing a role', async () => {
    await superAdminService.changeUserRole('7', 'SUPERADMIN')
    expect(apiClient.patch).toHaveBeenLastCalledWith('/users/admin/7/change-role', null, {
      params: { role: 'ADMIN' },
    })
    await superAdminService.changeUserRole('7', 'STAFF')
    expect(apiClient.patch).toHaveBeenLastCalledWith('/users/admin/7/change-role', null, {
      params: { role: 'FANPAGE_ADMIN' },
    })
  })
  it('fetches staff profile by user id for admin', async () => {
    get.mockResolvedValueOnce({
      userId: 2,
      email: 'organizer@ctu.edu.vn',
      staffProfile: { staffId: 'CB-0104', orgName: 'Đoàn CNTT' },
    })
    const res = await superAdminService.getAdminStaffProfile('2')
    expect(get).toHaveBeenLastCalledWith('/users/admin/2/staff-profile')
    expect(res).toEqual(
      expect.objectContaining({
        userId: 2,
        staffProfile: expect.objectContaining({ staffId: 'CB-0104' }),
      })
    )
  })
  it('propagates failed list requests instead of presenting a fake empty success', async () => {
    get.mockRejectedValue(new Error('offline'))
    await expect(superAdminService.getUsers()).rejects.toThrow('offline')
    await expect(superAdminService.getEvents()).rejects.toThrow('offline')
  })
})

describe('fanpage identity', () => {
  it('uses the full organization name and keeps help contacts separate from the admin', () => {
    const result = mapAdminFanpage(
      {
        id: 7,
        name: 'Đoàn TN - Hội SV',
        orgName: 'Đoàn Thanh niên - Hội Sinh viên Trường Đại học Cần Thơ',
        helpContact: 'office@ctu.edu.vn',
        helpPhone: '0292 3830 309',
      },
      {
        userId: 3,
        role: 'ADMIN',
        firstName: 'Nguyễn Văn',
        lastName: 'An',
        email: 'admin@ctu.edu.vn',
      },
      { email: 'admin@ctu.edu.vn', studentId: 'B123' }
    )
    expect(result).toMatchObject({
      name: 'Đoàn Thanh niên - Hội Sinh viên Trường Đại học Cần Thơ',
      representativeName: 'Nguyễn Văn An',
      representativeEmail: 'admin@ctu.edu.vn',
      representativeCode: 'B123',
      representativePhone: '',
      contactEmail: 'office@ctu.edu.vn',
      contactPhone: '0292 3830 309',
    })
  })
  it('does not invent an admin from helpContact or accept an unrelated profile', () => {
    expect(
      mapAdminFanpage({
        id: 7,
        name: 'Tên fanpage',
        orgName: ' ',
        helpContact: 'office@ctu.edu.vn',
      })
    ).toMatchObject({ name: 'Tên fanpage', representativeName: '', representativeEmail: '' })
    expect(
      mapAdminFanpage(
        { id: 7 },
        { email: 'admin@ctu.edu.vn' },
        { email: 'different@ctu.edu.vn', studentId: 'WRONG' }
      ).representativeCode
    ).toBe('')
  })
  it('selects the ADMIN membership instead of the first fanpage member', async () => {
    get.mockImplementation(async (url, config) => {
      if (url === '/fanpages/admin') {
        const params = config?.params as any
        return {
          content:
            params.status === 'ACTIVE' && params.isActive
              ? [{ id: 7, name: 'Tên ngắn', orgName: 'Tên đầy đủ', followerCount: 0 }]
              : [],
          last: true,
        }
      }
      if (url === '/fanpages/7/members')
        return [
          { userId: 10, role: 'MEMBER', firstName: 'Cộng tác viên' },
          {
            userId: 20,
            role: 'ADMIN',
            firstName: 'Nguyễn',
            lastName: 'An',
            email: 'admin@ctu.edu.vn',
          },
        ]
      if (url === '/fanpages/7/followers/count') return { followerCount: 42 }
      if (url === '/users/admin/20/profile') return { email: 'admin@ctu.edu.vn', studentId: 'B123' }
      throw new Error('Unexpected endpoint: ' + url)
    })
    const result = await superAdminService.getFanpages()
    expect(result.content[0]).toMatchObject({
      name: 'Tên đầy đủ',
      followersCount: 42,
      representativeName: 'Nguyễn An',
      representativeCode: 'B123',
      representativeEmail: 'admin@ctu.edu.vn',
    })
  })
})

describe('live follower counts and admin phone fields', () => {
  it('preserves a genuine zero from the count endpoint', async () => {
    get.mockResolvedValue({ followerCount: 0 } as any)
    expect(await superAdminService.getFanpageFollowerCount(7)).toBe(0)
  })
  it('distinguishes failed or missing counts from zero', async () => {
    get.mockRejectedValueOnce(new Error('offline'))
    expect(await superAdminService.getFanpageFollowerCount(7)).toBeNull()
    get.mockResolvedValueOnce({} as any)
    expect(await superAdminService.getFanpageFollowerCount(7)).toBeNull()
  })
  it('reads phoneNumber and staffId from the actual admin when present', () => {
    expect(
      mapAdminFanpage(
        { id: 7, helpPhone: '0292 000 000' },
        { email: 'admin@ctu.edu.vn', staffId: 'CB123', phoneNumber: '0901234567' }
      )
    ).toMatchObject({
      representativePhone: '0901234567',
      representativeCode: 'CB123',
      contactPhone: '0292 000 000',
    })
  })
})

it('retains all system permissions independently of student and staff profiles', async () => {
  const student = mapAdminUser(
    { userId: 1, email: 's@student.ctu.edu.vn', roles: ['STUDENT', 'FANPAGE_ADMIN'] },
    { email: 's@student.ctu.edu.vn', studentId: 'B123', schoolName: 'Khoa A' }
  )
  expect(student.systemRoles).toEqual(['STUDENT', 'FANPAGE_ADMIN'])
  expect(student.studentProfile?.studentId).toBe('B123')
  expect(student.staffProfile).toBeUndefined()
  const unknown = mapAdminUser({ userId: 2, email: 'someone@ctu.edu.vn', roles: ['FANPAGE_ADMIN'] })
  expect(unknown.staffProfile).toBeUndefined()
  await superAdminService.changeUserRoles('1', ['STUDENT', 'FANPAGE_ADMIN'])
  expect(apiClient.patch).toHaveBeenLastCalledWith('/users/admin/1/change-roles', [
    'STUDENT',
    'FANPAGE_ADMIN',
  ])
})

it('only adds or removes ADMIN while retaining original roles and profile identity', () => {
  const student = mapAdminUser(
    { userId: 1, email: 's@ctu.edu.vn', roles: ['STUDENT', 'FANPAGE_ADMIN'] },
    { email: 's@ctu.edu.vn', studentId: 'B123' }
  )
  expect(getUserDisplayRole(student)).toBe('STUDENT')
  const promoted = {
    ...student,
    role: 'SUPERADMIN' as const,
    systemRoles: getSuperAdminRoles(student, true),
  }
  expect(promoted.systemRoles).toEqual(['STUDENT', 'FANPAGE_ADMIN', 'ADMIN'])
  expect(getUserDisplayRole(promoted)).toBe('SUPERADMIN')
  expect(getSuperAdminRoles(promoted, false)).toEqual(['STUDENT', 'FANPAGE_ADMIN'])
  const staff = mapAdminUser({
    userId: 2,
    email: 'staff@ctu.edu.vn',
    roles: ['FANPAGE_ADMIN'],
    staffId: 'CB123',
  })
  expect(getUserDisplayRole(staff)).toBe('STAFF')
  expect(getSuperAdminRoles(staff, true)).toEqual(['FANPAGE_ADMIN', 'ADMIN'])
  const unknown = mapAdminUser({ userId: 3, roles: ['ADMIN'] })
  expect(() => getSuperAdminRoles(unknown, false)).toThrow('Chưa xác định')
})

it('lists memberships of the requested user and reports partial results honestly', async () => {
  get.mockImplementation(async (url, config) => {
    if (url === '/fanpages/admin') {
      const params = config?.params as any
      return {
        content:
          params.status === 'ACTIVE' && params.isActive
            ? [
                { id: 7, orgName: 'Tên đầy đủ' },
                { id: 8, name: 'Trang khác' },
                { id: 9, name: 'Không tải được' },
              ]
            : [],
        last: true,
      }
    }
    if (url === '/fanpages/7/members')
      return [
        { userId: 1, role: 'MEMBER' },
        { userId: 2, role: 'ADMIN' },
      ]
    if (url === '/fanpages/8/members') return [{ userId: 2, role: 'ADMIN' }]
    throw new Error('offline')
  })
  expect(await superAdminService.getUserFanpages('1')).toEqual({
    items: [{ id: '7', name: 'Tên đầy đủ', role: 'MEMBER', avatarUrl: undefined }],
    incomplete: true,
  })
})

it('matches membership by email when the users API omits the account ID', async () => {
  get.mockImplementation(async (url, config) => {
    if (url === '/fanpages/admin') {
      const params = config?.params as any
      return {
        content:
          params.status === 'ACTIVE' && params.isActive ? [{ id: 7, name: 'Fanpage A' }] : [],
        last: true,
      }
    }
    if (url === '/fanpages/7/members')
      return [{ userId: 20, email: 'organizer@ctu.edu.vn', role: 'ADMIN' }]
    throw new Error('Unexpected endpoint')
  })
  expect(mapAdminUser({ email: 'organizer@ctu.edu.vn' }).id).toBe('')
  expect((await superAdminService.getUserFanpages('', 'organizer@ctu.edu.vn')).items).toEqual([
    { id: '7', name: 'Fanpage A', role: 'ADMIN', avatarUrl: undefined },
  ])
  expect((await superAdminService.getUserFanpages('99', 'organizer@ctu.edu.vn')).items).toEqual([])
})

it('recovers a missing user ID from a matching real fanpage membership', async () => {
  get.mockImplementation(async (url, config) => {
    const params = config?.params as any
    if (url === '/users/admin')
      return {
        content: params.isActive
          ? [{ userId: null, email: 'organizer@ctu.edu.vn', roles: ['FANPAGE_ADMIN'] }]
          : [],
        last: true,
      }
    if (url === '/users/admin/profiles') return { content: [], last: true }
    if (url === '/fanpages/admin')
      return {
        content: params.status === 'ACTIVE' && params.isActive ? [{ id: 7 }] : [],
        last: true,
      }
    if (url === '/fanpages/7/members')
      return [{ userId: 20, email: 'organizer@ctu.edu.vn', role: 'ADMIN' }]
    throw new Error('Unexpected endpoint')
  })
  expect((await superAdminService.getUsers()).content[0].id).toBe('20')
})

it('does not submit account mutations with missing or fabricated IDs', async () => {
  vi.mocked(apiClient.patch).mockClear()
  await expect(superAdminService.changeUserRoles('', ['ADMIN'])).rejects.toThrow('Thiếu ID')
  await expect(superAdminService.changeUserRoles('undefined', ['ADMIN'])).rejects.toThrow(
    'Thiếu ID'
  )
  expect(apiClient.patch).not.toHaveBeenCalled()
})
