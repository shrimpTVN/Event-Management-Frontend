const fs = require('fs')
const path = require('path')

// =============================================================================
// MOCK DATA GENERATOR FOR EVENT MANAGEMENT FRONTEND
// Generates a comprehensive db.json with realistic data for all UI components
// =============================================================================

const db = {}

// ---------------------------------------------------------------------------
// 1. ROLES
// ---------------------------------------------------------------------------
db.roles = [
  { id: 1, name: 'ADMIN', description: 'Quản trị viên toàn hệ thống', isActive: true },
  { id: 2, name: 'STUDENT', description: 'Sinh viên Đại học Cần Thơ', isActive: true },
  { id: 3, name: 'FANPAGE_ADMIN', description: 'Ban quản trị CLB / Đoàn - Hội', isActive: true },
]

// ---------------------------------------------------------------------------
// 2. SCHOOLS
// ---------------------------------------------------------------------------
db.schools = [
  { id: 1, name: 'Trường Công nghệ Thông tin và Truyền thông', description: 'College of ICT', isActive: true },
  { id: 2, name: 'Trường Kinh tế', description: 'College of Economics', isActive: true },
  { id: 3, name: 'Trường Nông nghiệp', description: 'College of Agriculture', isActive: true },
  { id: 4, name: 'Trường Sư phạm', description: 'College of Education', isActive: true },
  { id: 5, name: 'Trường Bách khoa', description: 'College of Engineering', isActive: true },
]

// ---------------------------------------------------------------------------
// 3. MAJORS
// ---------------------------------------------------------------------------
db.majors = [
  { id: 1, code: '7480103', name: 'Kỹ thuật phần mềm', schoolId: 1, isActive: true },
  { id: 2, code: '7480101', name: 'Khoa học máy tính', schoolId: 1, isActive: true },
  { id: 3, code: '7480104', name: 'Hệ thống thông tin', schoolId: 1, isActive: true },
  { id: 4, code: '7340101', name: 'Quản trị kinh doanh', schoolId: 2, isActive: true },
  { id: 5, code: '7340201', name: 'Tài chính - Ngân hàng', schoolId: 2, isActive: true },
  { id: 6, code: '7620109', name: 'Nông học', schoolId: 3, isActive: true },
  { id: 7, code: '7140202', name: 'Sư phạm Toán học', schoolId: 4, isActive: true },
]

// ---------------------------------------------------------------------------
// 4. ASSOCIATIONS
// ---------------------------------------------------------------------------
db.associations = [
  { id: 1, name: 'Đoàn Trường Đại học Cần Thơ', address: 'Khu II, Đường 3/2, Q. Ninh Kiều, TP. Cần Thơ', description: 'Đoàn Thanh niên Cộng sản Hồ Chí Minh Trường Đại học Cần Thơ', isActive: true },
  { id: 2, name: 'Hội Sinh viên Trường Đại học Cần Thơ', address: 'Khu II, Đường 3/2, Q. Ninh Kiều, TP. Cần Thơ', description: 'Hội Sinh viên Việt Nam Trường Đại học Cần Thơ', isActive: true },
  { id: 3, name: 'Đoàn Trường Công nghệ Thông tin & Truyền thông', address: 'Nhà học CICT, Khu II, ĐHCT', description: 'Đoàn cơ sở Trường CNTT & TT', isActive: true },
  { id: 4, name: 'Chi hội Sinh viên Mỹ Xuyên - Trần Đề', address: 'Khu II, ĐHCT', description: 'Chi hội Sinh viên đồng hương Mỹ Xuyên - Trần Đề', isActive: true },
]

// ---------------------------------------------------------------------------
// 5. USERS (3 representative users)
// ---------------------------------------------------------------------------
db.users = [
  {
    id: 1, email: 'loc@student.ctu.edu.vn', password: '123123', providerId: 'LOCAL',
    firstName: 'Tài Lộc', lastName: 'Đoàn', gender: 'MALE',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    isActive: true, phoneNumber: '0901234567', dateOfBirth: '2004-09-23',
  },
  {
    id: 2, email: 'organizer@ctu.edu.vn', password: '123123', providerId: 'LOCAL',
    firstName: 'Minh Anh', lastName: 'Nguyễn', gender: 'FEMALE',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    isActive: true, phoneNumber: '0912345678', dateOfBirth: '1995-10-15',
  },
  {
    id: 3, email: 'admin@ctu.edu.vn', password: '123123', providerId: 'LOCAL',
    firstName: 'Quản Trị', lastName: 'Hệ Thống', gender: 'OTHER',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
    isActive: true, phoneNumber: '0923456789', dateOfBirth: '1990-05-20',
  },
]

// ---------------------------------------------------------------------------
// 6. USER_ROLES
// ---------------------------------------------------------------------------
db.user_roles = [
  { userId: 1, roleId: 2, isActive: true },
  { userId: 2, roleId: 3, isActive: true },
  { userId: 3, roleId: 1, isActive: true },
]

// ---------------------------------------------------------------------------
// 7. STUDENT PROFILES (enriched with classId, bio, etc.)
// ---------------------------------------------------------------------------
db.student_profiles = [
  {
    id: 1, studentId: 'B2303827', kNumber: 49, majorId: 1, userId: 1, associationId: 4,
    classId: 'DI2396A1', bio: 'Sinh viên ngành Kỹ thuật phần mềm, đam mê công nghệ và phát triển phần mềm.',
    academicProgram: 'Đại trà (Chương trình chuẩn)', status: 'Đang học',
    isActive: true,
  },
]

// ---------------------------------------------------------------------------
// 8. FANPAGE ADMIN PROFILES
// ---------------------------------------------------------------------------
db.fanpage_admin_profiles = [
  {
    id: 1, staffId: 'CB-0104', orgName: 'Đoàn Trường CNTT&TT', title: 'Bí thư Đoàn khoa',
    dob: '1995-10-15', phoneNumber: '02923872254', userId: 2, isActive: true,
  },
]

// ---------------------------------------------------------------------------
// 9. FANPAGES (6 organizations)
// ---------------------------------------------------------------------------
db.fanpages = [
  {
    id: 1, name: 'Đoàn Trường CNTT & TT',
    description: 'Kết nối sinh viên, tổ chức hoạt động học thuật và lan tỏa các chương trình bổ ích của Trường CNTT&TT.',
    avatarUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&auto=format&fit=crop&q=60',
    status: 'ACTIVE', orgType: 'YOUTH_UNION', orgName: 'Đoàn Trường Công Nghệ Thông Tin và Truyền Thông',
    parentOrg: 'Đoàn Trường Đại học Cần Thơ', helpContact: 'truongcntt@ctu.edu.vn', helpPhone: '0292 387 2254',
    followersCount: 12480, eventsCount: 18, isActive: true, createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 2, name: 'Trường Đại học Cần Thơ',
    description: 'Fanpage Chính thức Trường Đại học Cần Thơ.',
    avatarUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=120&auto=format&fit=crop&q=60',
    status: 'ACTIVE', orgType: 'UNION', orgName: 'Trường Đại học Cần Thơ',
    parentOrg: 'Bộ Giáo dục và Đào tạo', helpContact: 'social-admin@ctu.edu.vn', helpPhone: '0292 383 2663',
    followersCount: 58200, eventsCount: 142, isActive: true, createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 3, name: 'CLB Công nghệ phần mềm CTU',
    description: 'Không gian học tập, chia sẻ kiến thức công nghệ và lập trình cho sinh viên.',
    avatarUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=120&auto=format&fit=crop&q=60',
    status: 'ACTIVE', orgType: 'CLUB', orgName: 'CLB Công nghệ phần mềm',
    parentOrg: 'Đoàn Trường CNTT&TT', helpContact: 'software.club@ctu.edu.vn', helpPhone: '0987 654 321',
    followersCount: 840, eventsCount: 9, isActive: true, createdAt: '2026-03-15T08:00:00Z',
  },
  {
    id: 4, name: 'Đoàn Trường Nông nghiệp',
    description: 'Tổ chức hoạt động phong trào, tình nguyện và giao lưu cho sinh viên Trường Nông nghiệp.',
    avatarUrl: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=120&auto=format&fit=crop&q=60',
    status: 'ACTIVE', orgType: 'YOUTH_UNION', orgName: 'Đoàn Trường Nông nghiệp',
    parentOrg: 'Đoàn Trường Đại học Cần Thơ', helpContact: 'nongnghiep@ctu.edu.vn', helpPhone: '0292 387 3300',
    followersCount: 4200, eventsCount: 25, isActive: true, createdAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 5, name: 'CLB Tiếng Anh CTU',
    description: 'Học tiếng Anh, kỹ năng hội nhập quốc tế và giao lưu văn hóa cho sinh viên toàn trường.',
    avatarUrl: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=120&auto=format&fit=crop&q=60',
    status: 'ACTIVE', orgType: 'CLUB', orgName: 'CLB Tiếng Anh',
    parentOrg: 'Hội Sinh viên Trường ĐHCT', helpContact: 'english.club@ctu.edu.vn', helpPhone: '0976 543 210',
    followersCount: 3100, eventsCount: 15, isActive: true, createdAt: '2026-01-20T08:00:00Z',
  },
  {
    id: 6, name: 'CLB Thể thao CTU',
    description: 'Tổ chức giải đấu thể thao, rèn luyện thể chất và giao lưu đội tuyển sinh viên.',
    avatarUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=120&auto=format&fit=crop&q=60',
    status: 'ACTIVE', orgType: 'CLUB', orgName: 'CLB Thể thao',
    parentOrg: 'Hội Sinh viên Trường ĐHCT', helpContact: 'sports.club@ctu.edu.vn', helpPhone: '0965 432 100',
    followersCount: 2500, eventsCount: 20, isActive: true, createdAt: '2026-02-10T08:00:00Z',
  },
]

// ---------------------------------------------------------------------------
// 10. FANPAGE MEMBERS
// ---------------------------------------------------------------------------
db.fanpage_members = [
  { fanpageId: 1, userId: 2, role: 'ADMIN', isActive: true },
  { fanpageId: 2, userId: 2, role: 'MEMBER', isActive: true },
  { fanpageId: 3, userId: 2, role: 'ADMIN', isActive: true },
]

// ---------------------------------------------------------------------------
// 11. EVENT TYPES
// ---------------------------------------------------------------------------
db.event_types = [
  { id: 1, name: 'Workshop', description: 'Hội thảo tập huấn kỹ năng', isActive: true },
  { id: 2, name: 'Networking', description: 'Giao lưu, kết nối cộng đồng', isActive: true },
  { id: 3, name: 'Sports', description: 'Hoạt động thể dục thể thao', isActive: true },
  { id: 4, name: 'Volunteer', description: 'Chiến dịch tình nguyện vì cộng đồng', isActive: true },
  { id: 5, name: 'Academic', description: 'Nghiên cứu khoa học và học thuật', isActive: true },
  { id: 6, name: 'Seminar', description: 'Tọa đàm chuyên đề', isActive: true },
]

// ---------------------------------------------------------------------------
// 12. ACADEMIC YEARS
// ---------------------------------------------------------------------------
db.academic_years = [
  { id: 1, code: '2025-2026', startDate: '2025-09-01', endDate: '2026-06-30', isActive: false },
  { id: 2, code: '2026-2027', startDate: '2026-09-01', endDate: '2027-06-30', isActive: true },
]

// ---------------------------------------------------------------------------
// 13. SEMESTERS
// ---------------------------------------------------------------------------
db.semesters = [
  { id: 1, number: 1, academicYearId: 2, academicYear: '2026-2027', startDate: '2026-09-01', endDate: '2027-01-15', status: 'ACTIVE', isActive: true },
  { id: 2, number: 2, academicYearId: 2, academicYear: '2026-2027', startDate: '2027-01-16', endDate: '2027-05-30', status: 'UPCOMING', isActive: true },
]

// ---------------------------------------------------------------------------
// 14. CRITERIAS (SV5T hierarchy — from seed_criterias_sv5t.sql)
// ---------------------------------------------------------------------------
db.criterias = [
  // Root
  { id: 1, name: 'Danh hiệu "Sinh viên 5 tốt" Đại học Cần Thơ', note: 'Ban hành kèm Quyết định 17/QĐ-HSV ngày 04/3/2026', scope: 'UNIVERSITY', level: 0, childrenOrder: 1, parentId: null, isActive: true },
  // 5 Main Criteria (Level 1)
  { id: 10, name: 'Tiêu chuẩn Đạo đức tốt', note: 'Đạt đủ 03 tiêu chuẩn (1.1), (1.2) và (1.3)', scope: 'UNIVERSITY', level: 1, childrenOrder: 1, parentId: 1, isActive: true },
  { id: 20, name: 'Tiêu chuẩn Học tập tốt', note: 'Điểm trung bình cộng năm học đạt từ 3.0 trở lên, không nợ học phần', scope: 'UNIVERSITY', level: 1, childrenOrder: 2, parentId: 1, isActive: true },
  { id: 30, name: 'Tiêu chuẩn Thể lực tốt', note: 'Đạt tiêu chuẩn rèn luyện thể lực sinh viên', scope: 'UNIVERSITY', level: 1, childrenOrder: 3, parentId: 1, isActive: true },
  { id: 40, name: 'Tiêu chuẩn Tình nguyện tốt', note: 'Tham gia ít nhất 2 hoạt động tình nguyện trong năm học', scope: 'UNIVERSITY', level: 1, childrenOrder: 4, parentId: 1, isActive: true },
  { id: 50, name: 'Tiêu chuẩn Hội nhập tốt', note: 'Hoàn thành chứng chỉ ngoại ngữ / tin học hoặc giao lưu quốc tế', scope: 'UNIVERSITY', level: 1, childrenOrder: 5, parentId: 1, isActive: true },
  // Level 2 children for Đạo đức tốt
  { id: 101, name: 'Điểm rèn luyện đạt từ 85 điểm trở lên', note: 'Điểm rèn luyện TBC 3 HK trước đạt từ 85 trở lên', scope: 'UNIVERSITY', level: 2, childrenOrder: 1, parentId: 10, isActive: true },
  { id: 102, name: 'Không vi phạm pháp luật và nội quy', note: null, scope: 'UNIVERSITY', level: 2, childrenOrder: 2, parentId: 10, isActive: true },
  { id: 103, name: 'Đạt thêm 01 tiêu chí tư tưởng, đạo đức', note: 'Đạt ít nhất 01 tiêu chí trong 05 tiêu chí bên dưới', scope: 'UNIVERSITY', level: 2, childrenOrder: 3, parentId: 10, isActive: true },
  // Level 2 children for Học tập tốt
  { id: 201, name: 'Điểm trung bình cộng (hệ 4) đạt từ 3.0 trở lên', note: null, scope: 'UNIVERSITY', level: 2, childrenOrder: 1, parentId: 20, isActive: true },
  { id: 202, name: 'Không nợ học phần ở thời điểm xét', note: null, scope: 'UNIVERSITY', level: 2, childrenOrder: 2, parentId: 20, isActive: true },
  // Level 2 children for Thể lực tốt
  { id: 301, name: 'Đạt chuẩn thể lực hoặc tham gia giải thể thao', note: null, scope: 'UNIVERSITY', level: 2, childrenOrder: 1, parentId: 30, isActive: true },
  // Level 2 children for Tình nguyện tốt
  { id: 401, name: 'Tham gia ít nhất 02 hoạt động tình nguyện', note: null, scope: 'UNIVERSITY', level: 2, childrenOrder: 1, parentId: 40, isActive: true },
  // Level 2 children for Hội nhập tốt
  { id: 501, name: 'Hoàn thành chứng chỉ ngoại ngữ hoặc tin học', note: null, scope: 'UNIVERSITY', level: 2, childrenOrder: 1, parentId: 50, isActive: true },
]

// ---------------------------------------------------------------------------
// 15. POINT CATEGORIES (5 main ĐRL categories + key subcategories)
// ---------------------------------------------------------------------------
db.point_categories = [
  { id: 1, name: 'I. Trách nhiệm, tinh thần và thái độ trong học tập', note: 'Mã tiêu chí: I', maximum: 20, dateApply: '2026-08-01', level: 0, childrenOrder: 1, parentCategoryId: null, isActive: true },
  { id: 2, name: 'II. Ý thức chấp hành nội quy, quy chế', note: 'Mã tiêu chí: II', maximum: 25, dateApply: '2026-08-01', level: 0, childrenOrder: 2, parentCategoryId: null, isActive: true },
  { id: 3, name: 'III. Ý thức tham gia các hoạt động chính trị - xã hội', note: 'Mã tiêu chí: III', maximum: 20, dateApply: '2026-08-01', level: 0, childrenOrder: 3, parentCategoryId: null, isActive: true },
  { id: 4, name: 'IV. Phẩm chất công dân và quan hệ cộng đồng', note: 'Mã tiêu chí: IV', maximum: 25, dateApply: '2026-08-01', level: 0, childrenOrder: 4, parentCategoryId: null, isActive: true },
  { id: 5, name: 'V. Ý thức tham gia các hoạt động lớp, đoàn thể', note: 'Mã tiêu chí: V', maximum: 10, dateApply: '2026-08-01', level: 0, childrenOrder: 5, parentCategoryId: null, isActive: true },
  // Sub-categories (level 1)
  { id: 10, name: 'I.a Trách nhiệm và thái độ tham gia hoạt động học tập', note: 'Mã tiêu chí: I.a', maximum: 20, dateApply: '2026-08-01', level: 1, childrenOrder: 1, parentCategoryId: 1, isActive: true },
  { id: 20, name: 'II.a Ý thức chấp hành các văn bản chỉ đạo', note: 'Mã tiêu chí: II.a', maximum: 15, dateApply: '2026-08-01', level: 1, childrenOrder: 1, parentCategoryId: 2, isActive: true },
  { id: 21, name: 'II.b Ý thức chấp hành nội quy cơ sở đào tạo', note: 'Mã tiêu chí: II.b', maximum: 10, dateApply: '2026-08-01', level: 1, childrenOrder: 2, parentCategoryId: 2, isActive: true },
  { id: 30, name: 'III.a Ý thức tham gia các hoạt động chính trị - xã hội', note: 'Mã tiêu chí: III.a', maximum: 15, dateApply: '2026-08-01', level: 1, childrenOrder: 1, parentCategoryId: 3, isActive: true },
  { id: 31, name: 'III.b Ý thức tham gia phong trào tình nguyện', note: 'Mã tiêu chí: III.b', maximum: 5, dateApply: '2026-08-01', level: 1, childrenOrder: 2, parentCategoryId: 3, isActive: true },
  { id: 50, name: 'V.a Ý thức tham gia sinh hoạt lớp và đoàn thể', note: 'Mã tiêu chí: V.a', maximum: 5, dateApply: '2026-08-01', level: 1, childrenOrder: 1, parentCategoryId: 5, isActive: true },
  { id: 51, name: 'V.b Ý thức tham gia hoạt động đoàn hội và phong trào sinh viên', note: 'Mã tiêu chí: V.b', maximum: 5, dateApply: '2026-08-01', level: 1, childrenOrder: 2, parentCategoryId: 5, isActive: true },
]

// ---------------------------------------------------------------------------
// 16. EVENTS (15 events spread across Oct 2026 & past months)
// ---------------------------------------------------------------------------
db.events = [
  // === PAST / COMPLETED events ===
  {
    id: 1, name: 'HỘI THẢO CHUYÊN ĐỀ: TRÍ TUỆ NHÂN TẠO & XU HƯỚNG MÔ HÌNH NGÔN NGỮ LỚN (LLM)',
    description: 'Lắng nghe các chuyên gia AI đầu ngành chia sẻ về kiến trúc transformer, generative AI và lộ trình phát triển kỹ năng cho kỹ sư trẻ.',
    location: 'Phòng Hội thảo CICT, Đại học Cần Thơ',
    dateOpen: '2026-08-01T00:00:00Z', dateClose: '2026-08-14T17:00:00Z', dateHappen: '2026-08-15T14:00:00Z',
    capacity: 200, maleQuantity: 100, femaleQuantity: 100,
    bannerUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80',
    status: 'CLOSED', eventTypeId: 6, criteriaId: 20, fanpageId: 3, semesterId: 1, isActive: true,
    updatedAt: '2026-08-16T08:00:00Z',
  },
  {
    id: 2, name: 'SỰ KIỆN CHIẾU PHIM GÂY QUỸ - CHIẾN DỊCH VẦNG TRĂNG ƯƠM MƠ LẦN THỨ II NĂM 2026',
    description: 'Bạn đã sẵn sàng cho một buổi tối vừa xem phim, vừa làm một điều thật ý nghĩa chưa? Đoàn trường CNTT-TT mang đến đêm chiếu phim đặc biệt.',
    location: 'Hội trường Rùa, Đại học Cần Thơ',
    dateOpen: '2026-09-15T00:00:00Z', dateClose: '2026-09-22T17:00:00Z', dateHappen: '2026-09-22T18:00:00Z',
    capacity: 500, maleQuantity: 250, femaleQuantity: 250,
    bannerUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80',
    status: 'CLOSED', eventTypeId: 4, criteriaId: 40, fanpageId: 1, semesterId: 1, isActive: true,
    updatedAt: '2026-09-23T08:00:00Z',
  },
  {
    id: 3, name: 'TUYỂN CỔ ĐỘNG VIÊN TRẬN TỨ KẾT GIẢI FUTSAL - VIETTEL TAMMI CUP 2026',
    description: 'Hãy cùng hòa vào không khí cuồng nhiệt trên khán đài tiếp thêm sức mạnh cho các chàng trai của chúng ta!',
    location: 'Nhà Thi Đấu mới, Đại học Cần Thơ',
    dateOpen: '2026-09-20T00:00:00Z', dateClose: '2026-09-29T18:00:00Z', dateHappen: '2026-09-29T19:30:00Z',
    capacity: 1000, maleQuantity: 500, femaleQuantity: 500,
    bannerUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80',
    status: 'CLOSED', eventTypeId: 3, criteriaId: 30, fanpageId: 2, semesterId: 1, isActive: true,
    updatedAt: '2026-09-30T08:00:00Z',
  },
  // === CURRENT / OCTOBER 2026 events ===
  {
    id: 4, name: 'WORKSHOP: KỸ NĂNG VIẾT CV VÀ PHỎNG VẤN THÀNH CÔNG CHO SINH VIÊN IT',
    description: 'Học cách trình bày CV ấn tượng, xây dựng portfolio GitHub, và luyện kỹ năng phỏng vấn với HR từ các công ty công nghệ.',
    location: 'Phòng Lab 3, Trường CNTT&TT',
    dateOpen: '2026-10-01T00:00:00Z', dateClose: '2026-10-07T17:00:00Z', dateHappen: '2026-10-08T14:00:00Z',
    capacity: 80, maleQuantity: 40, femaleQuantity: 40,
    bannerUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
    status: 'CLOSED', eventTypeId: 1, criteriaId: 50, fanpageId: 1, semesterId: 1, isActive: true,
    updatedAt: '2026-10-09T08:00:00Z',
  },
  {
    id: 5, name: 'NGÀY HỘI VIỆC LÀM VÀ KẾT NỐI DOANH NGHIỆP CNTT 2026',
    description: 'Gặp gỡ hơn 30 doanh nghiệp công nghệ hàng đầu, phỏng vấn thử, nhận cơ hội thực tập và tuyển dụng trực tiếp.',
    location: 'Hội trường Lớn Khu II, Đại học Cần Thơ',
    dateOpen: '2026-10-01T00:00:00Z', dateClose: '2026-10-11T17:00:00Z', dateHappen: '2026-10-12T08:00:00Z',
    capacity: 300, maleQuantity: 150, femaleQuantity: 150,
    bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    status: 'CLOSED', eventTypeId: 1, criteriaId: 20, fanpageId: 1, semesterId: 1, isActive: true,
    updatedAt: '2026-10-13T08:00:00Z',
  },
  {
    id: 6, name: 'GIẢI CHẠY BỘ "CTU RUN 2026" - RÈN LUYỆN SỨC KHỎE, NÂNG TẦM TINH THẦN',
    description: 'Tham gia giải chạy bộ toàn trường với các cự ly 3km, 5km và 10km. Cùng rèn luyện thể chất và nhận thưởng hấp dẫn.',
    location: 'Sân vận động Đại học Cần Thơ',
    dateOpen: '2026-10-10T00:00:00Z', dateClose: '2026-10-14T17:00:00Z', dateHappen: '2026-10-15T06:00:00Z',
    capacity: 500, maleQuantity: 300, femaleQuantity: 200,
    bannerUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80',
    status: 'CLOSED', eventTypeId: 3, criteriaId: 30, fanpageId: 6, semesterId: 1, isActive: true,
    updatedAt: '2026-10-16T08:00:00Z',
  },
  {
    id: 7, name: 'CHIẾN DỊCH TÌNH NGUYỆN "XANH MÁI TRƯỜNG" - TRỒNG CÂY KHU II',
    description: 'Cùng sinh viên tình nguyện trồng 200 cây xanh tại khuôn viên Khu II, góp phần bảo vệ môi trường và làm đẹp trường học.',
    location: 'Khu II, Đại học Cần Thơ',
    dateOpen: '2026-10-15T00:00:00Z', dateClose: '2026-10-21T17:00:00Z', dateHappen: '2026-10-22T07:00:00Z',
    capacity: 150, maleQuantity: 80, femaleQuantity: 70,
    bannerUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80',
    status: 'PUBLISHED', eventTypeId: 4, criteriaId: 40, fanpageId: 4, semesterId: 1, isActive: true,
    updatedAt: '2026-10-15T10:00:00Z',
  },
  {
    id: 8, name: 'TỌA ĐÀM: SINH VIÊN VỚI CHUYỂN ĐỔI SỐ TRONG NÔNG NGHIỆP',
    description: 'Tìm hiểu về ứng dụng IoT, AI trong nông nghiệp thông minh cùng các chuyên gia và doanh nghiệp nông nghiệp công nghệ cao.',
    location: 'Hội trường Trường Nông nghiệp, ĐHCT',
    dateOpen: '2026-10-18T00:00:00Z', dateClose: '2026-10-22T12:00:00Z', dateHappen: '2026-10-23T14:00:00Z',
    capacity: 120, maleQuantity: 60, femaleQuantity: 60,
    bannerUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80',
    status: 'PUBLISHED', eventTypeId: 6, criteriaId: 20, fanpageId: 4, semesterId: 1, isActive: true,
    updatedAt: '2026-10-18T10:00:00Z',
  },
  {
    id: 9, name: 'ENGLISH SPEAKING CLUB - DEBATE NIGHT: "AI VS HUMAN CREATIVITY"',
    description: 'Rèn luyện kỹ năng tranh biện bằng tiếng Anh với chủ đề nóng: Trí tuệ nhân tạo có thể thay thế sáng tạo con người?',
    location: 'Phòng Seminar, Thư viện ĐHCT',
    dateOpen: '2026-10-20T00:00:00Z', dateClose: '2026-10-28T12:00:00Z', dateHappen: '2026-10-29T18:30:00Z',
    capacity: 60, maleQuantity: 30, femaleQuantity: 30,
    bannerUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
    status: 'PUBLISHED', eventTypeId: 5, criteriaId: 50, fanpageId: 5, semesterId: 1, isActive: true,
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 10, name: 'HACKATHON CTU 2026 - XÂY DỰNG ỨNG DỤNG TRONG 24 GIỜ',
    description: 'Cuộc thi lập trình 24 giờ dành cho sinh viên CNTT. Đội chiến thắng nhận giải thưởng 10 triệu đồng và cơ hội thực tập tại FPT Software.',
    location: 'Lab Innovation Hub, Trường CNTT&TT',
    dateOpen: '2026-10-22T00:00:00Z', dateClose: '2026-10-28T23:59:00Z', dateHappen: '2026-10-29T08:00:00Z',
    capacity: 100, maleQuantity: 60, femaleQuantity: 40,
    bannerUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    status: 'PUBLISHED', eventTypeId: 5, criteriaId: 20, fanpageId: 3, semesterId: 1, isActive: true,
    updatedAt: '2026-10-22T10:00:00Z',
  },
  // === UPCOMING / FUTURE events ===
  {
    id: 11, name: 'ĐÊM VĂN NGHỆ "TUỔI TRẺ CẦN THƠ" - CHÀO MỪNG NGÀY NHÀ GIÁO VIỆT NAM',
    description: 'Đêm văn nghệ hoành tráng với các tiết mục ca múa nhạc kịch, tri ân thầy cô nhân ngày 20/11.',
    location: 'Sân khấu ngoài trời Khu II, ĐHCT',
    dateOpen: '2026-11-01T00:00:00Z', dateClose: '2026-11-18T17:00:00Z', dateHappen: '2026-11-20T19:00:00Z',
    capacity: 800, maleQuantity: 400, femaleQuantity: 400,
    bannerUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    status: 'PUBLISHED', eventTypeId: 2, criteriaId: 10, fanpageId: 2, semesterId: 1, isActive: true,
    updatedAt: '2026-10-20T08:00:00Z',
  },
  {
    id: 12, name: 'GIẢI BÓNG CHUYỀN SINH VIÊN TRƯỜNG CNTT&TT MỞ RỘNG 2026',
    description: 'Giải bóng chuyền quy mô trường với sự tham gia của 16 đội, thi đấu vòng bảng và trực tiếp loại.',
    location: 'Sân bóng chuyền Khu II, ĐHCT',
    dateOpen: '2026-11-05T00:00:00Z', dateClose: '2026-11-14T17:00:00Z', dateHappen: '2026-11-15T07:30:00Z',
    capacity: 200, maleQuantity: 120, femaleQuantity: 80,
    bannerUrl: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1200&q=80',
    status: 'DRAFT', eventTypeId: 3, criteriaId: 30, fanpageId: 6, semesterId: 1, isActive: true,
    updatedAt: '2026-10-21T08:00:00Z',
  },
  {
    id: 13, name: 'WORKSHOP FIGMA & THIẾT KẾ UI/UX CHO NGƯỜI MỚI BẮT ĐẦU',
    description: 'Hướng dẫn sử dụng Figma từ cơ bản đến nâng cao, thiết kế giao diện ứng dụng di động thực tế trong 3 giờ.',
    location: 'Phòng Lab 5, Trường CNTT&TT',
    dateOpen: '2026-10-25T00:00:00Z', dateClose: '2026-11-04T17:00:00Z', dateHappen: '2026-11-05T14:00:00Z',
    capacity: 50, maleQuantity: 25, femaleQuantity: 25,
    bannerUrl: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=1200&q=80',
    status: 'PUBLISHED', eventTypeId: 1, criteriaId: 50, fanpageId: 3, semesterId: 1, isActive: true,
    updatedAt: '2026-10-25T08:00:00Z',
  },
  {
    id: 14, name: 'CHIẾN DỊCH HIẾN MÁU NHÂN ĐẠO "GIỌT HỒNG YÊU THƯƠNG" LẦN V',
    description: 'Mỗi giọt máu cho đi, một cuộc đời ở lại. Tham gia hiến máu tình nguyện cùng Hội Chữ thập đỏ Cần Thơ.',
    location: 'Sảnh Thư viện Đại học Cần Thơ',
    dateOpen: '2026-10-20T00:00:00Z', dateClose: '2026-10-28T17:00:00Z', dateHappen: '2026-10-29T07:30:00Z',
    capacity: 400, maleQuantity: 200, femaleQuantity: 200,
    bannerUrl: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1200&q=80',
    status: 'PUBLISHED', eventTypeId: 4, criteriaId: 40, fanpageId: 2, semesterId: 1, isActive: true,
    updatedAt: '2026-10-20T08:00:00Z',
  },
  {
    id: 15, name: 'SEMINAR: BLOCKCHAIN & WEB3 - CƠ HỘI NGHỀ NGHIỆP CHO SINH VIÊN',
    description: 'Tìm hiểu công nghệ blockchain, smart contract và các cơ hội việc làm trong lĩnh vực Web3.',
    location: 'Phòng Hội thảo CICT, Đại học Cần Thơ',
    dateOpen: '2026-10-20T00:00:00Z', dateClose: '2026-10-27T17:00:00Z', dateHappen: '2026-10-29T14:00:00Z',
    capacity: 100, maleQuantity: 60, femaleQuantity: 40,
    bannerUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80',
    status: 'PUBLISHED', eventTypeId: 6, criteriaId: 20, fanpageId: 1, semesterId: 1, isActive: true,
    updatedAt: '2026-10-20T10:00:00Z',
  },
]

// ---------------------------------------------------------------------------
// 17. EVENT POINTS (training point rewards per event)
// ---------------------------------------------------------------------------
db.event_points = [
  { id: 1, eventId: 1, pointCategoryId: 1, point: 4, isActive: true },
  { id: 2, eventId: 2, pointCategoryId: 5, point: 3, isActive: true },
  { id: 3, eventId: 2, pointCategoryId: 3, point: 2, isActive: true },
  { id: 4, eventId: 3, pointCategoryId: 3, point: 2, isActive: true },
  { id: 5, eventId: 4, pointCategoryId: 1, point: 3, isActive: true },
  { id: 6, eventId: 5, pointCategoryId: 1, point: 5, isActive: true },
  { id: 7, eventId: 6, pointCategoryId: 3, point: 3, isActive: true },
  { id: 8, eventId: 7, pointCategoryId: 3, point: 4, isActive: true },
  { id: 9, eventId: 7, pointCategoryId: 5, point: 2, isActive: true },
  { id: 10, eventId: 8, pointCategoryId: 1, point: 3, isActive: true },
  { id: 11, eventId: 9, pointCategoryId: 1, point: 3, isActive: true },
  { id: 12, eventId: 10, pointCategoryId: 1, point: 5, isActive: true },
  { id: 13, eventId: 11, pointCategoryId: 5, point: 3, isActive: true },
  { id: 14, eventId: 13, pointCategoryId: 1, point: 4, isActive: true },
  { id: 15, eventId: 14, pointCategoryId: 3, point: 5, isActive: true },
  { id: 16, eventId: 14, pointCategoryId: 4, point: 3, isActive: true },
  { id: 17, eventId: 15, pointCategoryId: 1, point: 3, isActive: true },
]

// ---------------------------------------------------------------------------
// 18. REGISTRATIONS (diverse statuses for history page)
// ---------------------------------------------------------------------------
db.registrations = [
  // COMPLETED events (past, with check-in/out)
  {
    userId: 1, eventId: 1, regDate: '2026-08-10T09:00:00Z',
    checkInAt: '2026-08-15T13:50:00Z', checkInEvidenceUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
    checkOutAt: '2026-08-15T17:05:00Z', checkOutEvidenceUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
    status: 'COMPLETED', reason: null,
  },
  {
    userId: 1, eventId: 2, regDate: '2026-09-18T14:20:00Z',
    checkInAt: '2026-09-22T17:50:00Z', checkInEvidenceUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
    checkOutAt: '2026-09-22T21:00:00Z', checkOutEvidenceUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
    status: 'COMPLETED', reason: null,
  },
  {
    userId: 1, eventId: 4, regDate: '2026-10-03T08:00:00Z',
    checkInAt: '2026-10-08T13:50:00Z', checkInEvidenceUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
    checkOutAt: '2026-10-08T16:30:00Z', checkOutEvidenceUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
    status: 'COMPLETED', reason: null,
  },
  // CANCELLED registration
  {
    userId: 1, eventId: 3, regDate: '2026-09-25T10:00:00Z',
    checkInAt: null, checkInEvidenceUrl: null, checkOutAt: null, checkOutEvidenceUrl: null,
    status: 'CANCELLED', reason: 'Bận lịch học, không thể tham gia',
  },
  // CHECKED_IN (ongoing today's event)
  {
    userId: 1, eventId: 8, regDate: '2026-10-19T08:00:00Z',
    checkInAt: '2026-10-23T13:55:00Z', checkInEvidenceUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
    checkOutAt: null, checkOutEvidenceUrl: null,
    status: 'CHECKED_IN', reason: null,
  },
  // REGISTERED (upcoming events)
  {
    userId: 1, eventId: 5, regDate: '2026-10-02T10:00:00Z',
    checkInAt: null, checkInEvidenceUrl: null, checkOutAt: null, checkOutEvidenceUrl: null,
    status: 'REGISTERED', reason: null,
  },
  {
    userId: 1, eventId: 7, regDate: '2026-10-16T09:00:00Z',
    checkInAt: null, checkInEvidenceUrl: null, checkOutAt: null, checkOutEvidenceUrl: null,
    status: 'REGISTERED', reason: null,
  },
  {
    userId: 1, eventId: 9, regDate: '2026-10-21T10:00:00Z',
    checkInAt: null, checkInEvidenceUrl: null, checkOutAt: null, checkOutEvidenceUrl: null,
    status: 'REGISTERED', reason: null,
  },
  {
    userId: 1, eventId: 10, regDate: '2026-10-23T08:00:00Z',
    checkInAt: null, checkInEvidenceUrl: null, checkOutAt: null, checkOutEvidenceUrl: null,
    status: 'REGISTERED', reason: null,
  },
  {
    userId: 1, eventId: 14, regDate: '2026-10-22T14:00:00Z',
    checkInAt: null, checkInEvidenceUrl: null, checkOutAt: null, checkOutEvidenceUrl: null,
    status: 'REGISTERED', reason: null,
  },
  {
    userId: 1, eventId: 15, regDate: '2026-10-22T16:00:00Z',
    checkInAt: null, checkInEvidenceUrl: null, checkOutAt: null, checkOutEvidenceUrl: null,
    status: 'REGISTERED', reason: null,
  },
  // ABSENT (missed event)
  {
    userId: 1, eventId: 6, regDate: '2026-10-12T10:00:00Z',
    checkInAt: null, checkInEvidenceUrl: null, checkOutAt: null, checkOutEvidenceUrl: null,
    status: 'REJECTED', reason: 'Vắng mặt không phép',
  },
]

// ---------------------------------------------------------------------------
// 19. STUDENT CRITERIA PROGRESS
// ---------------------------------------------------------------------------
db.student_criteria_progress = [
  { id: 1, userId: 1, criteriaId: 10, academicYearId: 2, eventId: null, completionSource: 'MANUAL', note: 'Điểm rèn luyện đạt 92/100', isActive: true },
  { id: 2, userId: 1, criteriaId: 20, academicYearId: 2, eventId: 1, completionSource: 'EVENT_CHECKOUT', note: 'Hoàn thành Hội thảo AI & LLM', isActive: true },
  { id: 3, userId: 1, criteriaId: 40, academicYearId: 2, eventId: 2, completionSource: 'EVENT_CHECKOUT', note: 'Hoàn thành chiến dịch Vầng trăng ươm mơ', isActive: true },
]

// ---------------------------------------------------------------------------
// 20. POINT TRANSACTIONS
// ---------------------------------------------------------------------------
db.point_transactions = [
  { id: 1, userId: 1, semesterId: 1, pointCategoryId: 1, eventId: 1, points: 4, type: 'EVENT', status: 'CONFIRMED', description: 'Tham gia Hội thảo AI & LLM', createdAt: '2026-08-15T17:10:00Z' },
  { id: 2, userId: 1, semesterId: 1, pointCategoryId: 5, eventId: 2, points: 3, type: 'EVENT', status: 'CONFIRMED', description: 'Chiếu phim gây quỹ Vầng trăng ươm mơ', createdAt: '2026-09-22T21:05:00Z' },
  { id: 3, userId: 1, semesterId: 1, pointCategoryId: 3, eventId: 2, points: 2, type: 'EVENT', status: 'CONFIRMED', description: 'Chiếu phim gây quỹ - Hoạt động CTXH', createdAt: '2026-09-22T21:05:00Z' },
  { id: 4, userId: 1, semesterId: 1, pointCategoryId: 1, eventId: 4, points: 3, type: 'EVENT', status: 'CONFIRMED', description: 'Workshop CV & Phỏng vấn IT', createdAt: '2026-10-08T16:35:00Z' },
]

// ---------------------------------------------------------------------------
// 21. STUDENT SEMESTER POINTS (aggregate per category)
// ---------------------------------------------------------------------------
db.student_semester_points = [
  { id: 1, userId: 1, semesterId: 1, pointCategoryId: 1, totalPoint: 16, finalizedAt: null },
  { id: 2, userId: 1, semesterId: 1, pointCategoryId: 2, totalPoint: 22, finalizedAt: null },
  { id: 3, userId: 1, semesterId: 1, pointCategoryId: 3, totalPoint: 12, finalizedAt: null },
  { id: 4, userId: 1, semesterId: 1, pointCategoryId: 4, totalPoint: 10, finalizedAt: null },
  { id: 5, userId: 1, semesterId: 1, pointCategoryId: 5, totalPoint: 5, finalizedAt: null },
]

// ---------------------------------------------------------------------------
// WRITE TO FILE
// ---------------------------------------------------------------------------
const outputPath = path.join(__dirname, 'db.json')
fs.writeFileSync(outputPath, JSON.stringify(db, null, 2), 'utf8')
console.log(`✅ Generated mock DB with:`)
Object.entries(db).forEach(([key, val]) => {
  console.log(`   ${key}: ${Array.isArray(val) ? val.length : 1} records`)
})
console.log(`\n📄 Written to: ${outputPath}`)
