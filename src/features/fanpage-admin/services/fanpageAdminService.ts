import type {
  FanpageSummary,
  FanpageActivityStats,
  UpcomingEventReminder,
  FanpageFeedPost,
} from '../types/fanpageAdmin.types'

export const MOCK_CURRENT_FANPAGE: FanpageSummary = {
  id: 'fp-cn-tt',
  code: 'CNTT',
  name: 'Đoàn Trường CNTT & TT',
  fullName: 'Đoàn Trường Công Nghệ Thông Tin và Truyền Thông - Đại Học Cần Thơ',
  avatarText: 'CTU',
  role: 'Quản trị viên',
  isVerified: true,
  email: 'truongcntt@ctu.edu.vn',
  phone: '0292 387 2254',
  address: 'Khu II, Đại học Cần Thơ, Đường 3/2, Xuân Khánh, Ninh Kiều, Cần Thơ',
  followersCount: 1248,
  eventsCount: 18,
  description:
    'Kết nối sinh viên, tổ chức hoạt động học thuật và lan tỏa các chương trình bổ ích của Trường CNTT&TT.',
}

export const MOCK_AVAILABLE_FANPAGES: FanpageSummary[] = [
  MOCK_CURRENT_FANPAGE,
  {
    id: 'fp-ctu-main',
    code: 'CTU',
    name: 'Trường Đại học Cần Thơ',
    fullName: 'Fanpage Chính thức Trường Đại học Cần Thơ',
    avatarText: 'CTU',
    role: 'Quản trị viên cấp cao',
    isVerified: true,
    email: 'social-admin@ctu.edu.vn',
    phone: '0292 383 2663',
    address: 'Khu II, Đại học Cần Thơ',
    followersCount: 58200,
    eventsCount: 142,
    description: 'Trang thông tin sự kiện chính thức toàn trường Đại học Cần Thơ.',
  },
  {
    id: 'fp-clb-software',
    code: 'CLB',
    name: 'CLB Công nghệ phần mềm CTU',
    fullName: 'Câu lạc bộ Công nghệ Phần mềm Khoa CNTT&TT',
    avatarText: 'SE',
    role: 'Biên tập viên',
    isVerified: false,
    email: 'software.club@ctu.edu.vn',
    phone: '0987 654 321',
    address: 'Văn phòng Đoàn Khoa CNTT&TT, Khu II',
    followersCount: 840,
    eventsCount: 9,
    description: 'Không gian học tập, chia sẻ kiến thức công nghệ và lập trình cho sinh viên.',
  },
]

export const MOCK_ACTIVITY_STATS: FanpageActivityStats = {
  periodLabel: '7 ngày gần nhất',
  eventsCount: 8,
  interactionsCount: 426,
  newFollowersCount: 36,
  responseRatePercent: 92,
  pendingCommentsCount: 3,
}

export const MOCK_UPCOMING_REMINDER: UpcomingEventReminder = {
  id: 'evt-jobfair-2026',
  title: 'Ngày hội việc làm CNTT 2026',
  monthText: 'TH10',
  dayText: '12',
  registrationsCount: 186,
  dateText: '12/10/2026',
}

export const MOCK_FEED_POSTS: FanpageFeedPost[] = [
  {
    id: 'post-1',
    authorName: 'Đoàn Trường CNTT & TT',
    authorCode: 'CNTT',
    authorAvatarText: 'CT',
    timeAgo: '2 giờ',
    isPublic: true,
    title: 'NGÀY HỘI VIỆC LÀM CNTT 2026',
    summary:
      'Gặp gỡ doanh nghiệp công nghệ hàng đầu, khám phá cơ hội thực tập và chuẩn bị hành trang nghề nghiệp vững chắc cùng hơn 30 đơn vị tuyển dụng.',
    bannerUrl:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    likesCount: 126,
    commentsCount: 18,
    sharesCount: 9,
    isLiked: false,
  },
  {
    id: 'post-2',
    authorName: 'Đoàn Trường CNTT & TT',
    authorCode: 'CNTT',
    authorAvatarText: 'CT',
    timeAgo: '1 ngày',
    isPublic: true,
    title: 'HỘI THẢO CHUYÊN ĐỀ: TRÍ TUỆ NHÂN TẠO & TƯƠNG LAI CÔNG NGHỆ',
    summary:
      'Cơ hội lắng nghe chia sẻ từ các chuyên gia AI đầu ngành về xu hướng mô hình ngôn ngữ lớn và lộ trình phát triển kỹ năng cho kỹ sư phần mềm trẻ.',
    bannerUrl:
      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80',
    likesCount: 89,
    commentsCount: 12,
    sharesCount: 5,
    isLiked: true,
  },
]

export const fanpageAdminService = {
  getCurrentFanpage: async (): Promise<FanpageSummary> => {
    return MOCK_CURRENT_FANPAGE
  },
  getAvailableFanpages: async (): Promise<FanpageSummary[]> => {
    return MOCK_AVAILABLE_FANPAGES
  },
  getActivityStats: async (): Promise<FanpageActivityStats> => {
    return MOCK_ACTIVITY_STATS
  },
  getUpcomingReminder: async (): Promise<UpcomingEventReminder> => {
    return MOCK_UPCOMING_REMINDER
  },
  getFeedPosts: async (): Promise<FanpageFeedPost[]> => {
    return MOCK_FEED_POSTS
  },
}
