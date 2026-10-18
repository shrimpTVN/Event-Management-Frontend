import type { FanpageDetail, FanpagePublicEventPost } from '../types/fanpage.types'

export const mockFanpageDetail: FanpageDetail = {
  id: 'fp-doan-hoi-ctu',
  name: 'Đoàn TN – Hội SV Đại Học Cần Thơ',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  followerCount: 100,
  eventCount: 100,
  email: 'vpdoan_hoi@ctu.edu.vn',
  description:
    'Mạng xã hội chính thức của tổ chức Đoàn - Hội trường Đại học Cần Thơ, là nơi cập nhật những thông tin mới nhất về hoạt động Đoàn, hoạt động Hội, tin tức tuyển dụng-việc làm, học bổng........, là tổ chức đại diện quyền lợi hợp pháp của Đoàn viên, Sinh viên trường Đại học Cần Thơ.',
  isFollowing: false,
  isVerified: true,
  phone: '0292.3832663',
  orgType: 'Tổ chức Đoàn - Hội',
  parentOrg: 'Trường Đại học Cần Thơ',
}

export const mockFanpageEvents: FanpagePublicEventPost[] = [
  {
    id: 'post-1',
    eventId: 'evt-101',
    authorName: 'Đoàn Thanh Niên - Hội SV Đại Học Cần Thơ',
    authorAvatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    timeAgo: '5h trước',
    isFollowingAuthor: true,
    title:
      'MỜI SINH VIÊN THAM GIA CHƯƠNG TRÌNH TUYÊN TRUYỀN CÔNG TÁC PHÒNG CHÁY, CHỮA CHÁY VÀ CỨU NẠN, CỨU HỘ',
    description:
      'Bạn đã sẵn sàng cho một buổi tối vừa xem phim, vừa làm một điều thật ý nghĩa chưa? Tháng 9 này, Đoàn trường CNTT-TT mang đến một đêm chiếu phim đặc biệt...',
    bannerUrl:
      'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=1200&auto=format&fit=crop&q=80',
    dateHappen: '18/10/2026 · 16:00–18:00',
    location: 'Hội trường Rùa – Đại học Cần Thơ',
    benefits: 'Cộng 03 điểm rèn luyện mục V.b',
    capacityText: '700 sinh viên',
    commentsCount: 12,
    sharesCount: 25,
    isSaved: false,
    canRegister: true,
  },
  {
    id: 'post-2',
    eventId: 'evt-102',
    authorName: 'Đoàn Thanh Niên - Hội SV Đại Học Cần Thơ',
    authorAvatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    timeAgo: '1 ngày trước',
    isFollowingAuthor: true,
    title: 'GIẢI BÓNG ĐÁ TRUYỀN THỐNG HỌC SINH - SINH VIÊN ĐẠI HỌC CẦN THƠ NĂM 2026',
    description:
      'Chào mừng năm học mới 2026 - 2027 và phong trào rèn luyện thân thể theo gương Bác Hồ vĩ đại, Đoàn trường trân trọng kính mời toàn thể các bạn sinh viên đến tham gia cổ vũ và tranh tài tại giải đấu...',
    bannerUrl:
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=80',
    dateHappen: '25/10/2026 · 07:30–11:30',
    location: 'Sân vận động Trung tâm Thể dục Thể thao ĐHCT',
    benefits: 'Cộng 05 điểm rèn luyện mục III.b',
    capacityText: '500 sinh viên',
    commentsCount: 38,
    sharesCount: 42,
    isSaved: true,
    canRegister: true,
  },
]
