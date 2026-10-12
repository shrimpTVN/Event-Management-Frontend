import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  StudentLeftSidebar,
  StudentRightSidebar,
  FeedTabs,
  EventFeedCard,
  type FeedTabType,
  type Event,
} from '@/features/events'

// Mock events data matching Figma designs (images 4 & 5)
const MOCK_STUDENT_FEED_EVENTS: Event[] = [
  {
    id: 'evt-1',
    title:
      'SỰ KIỆN CHIẾU PHIM GÂY QUỸ - CHIẾN DỊCH VẦNG TRĂNG ƯƠM MƠ LẦN THỨ II NĂM 2026',
    description:
      'Bạn đã sẵn sàng cho một buổi tối vừa xem phim, vừa làm một điều thật ý nghĩa chưa? Tháng 9 này, Đoàn trường CNTT-TT mang đến một đêm chiếu phim đặc biệt với tác phẩm kinh điển "3 Chàng Ngốc", cùng gây quỹ ủng hộ trẻ em có hoàn cảnh khó khăn tại địa phương.',
    category: 'NETWORKING',
    status: 'PUBLISHED',
    bannerUrl:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80',
    startTime: '22/09/2026 · 18:00',
    endTime: '21:30',
    location: {
      type: 'OFFLINE',
      address: 'Hội trường Rùa',
      city: 'Đại học Cần Thơ',
    },
    capacity: 500,
    registeredCount: 382,
    price: 0,
    organizerId: 'org-cntt',
    organizerName: 'Đoàn Trường Công nghệ Thông tin và Truyền thông - Đại Học Cần Thơ',
    organizerAvatarUrl:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&auto=format&fit=crop&q=60',
    pointsReward: 'Cộng 03 điểm rèn luyện mục V.b',
    quotaText: '500 sinh viên',
    timeAgo: '10h trước',
    isFollowed: true,
    isSaved: false,
    isModerationRequired: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'evt-2',
    title:
      'TUYỂN CỔ ĐỘNG VIÊN THAM GIA CỔ VŨ TRẬN TỨ KẾT GIẢI FUTSAL SINH VIÊN ĐẠI HỌC CẦN THƠ - VIETTEL TAMMI CUP 2026',
    description:
      'Sau những màn tranh tài đầy nỗ lực, Trường Kinh tế đã chính thức góp mặt ở vòng Tứ kết Giải Futsal Sinh viên Đại học Cần Thơ - Viettel Tammi Cup 2026. Hãy cùng hòa vào không khí cuồng nhiệt trên khán đài tiếp thêm sức mạnh cho các chàng trai của chúng ta!',
    category: 'OTHER',
    status: 'PUBLISHED',
    bannerUrl:
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80',
    startTime: '29/09/2026 · 19:30',
    endTime: '21:00',
    location: {
      type: 'OFFLINE',
      address: 'Nhà Thi Đấu mới',
      city: 'Khu II ĐHCT',
    },
    capacity: 300,
    registeredCount: 245,
    price: 0,
    organizerId: 'org-kinhte',
    organizerName: 'Đoàn trường Kinh tế - Đại Học Cần Thơ',
    organizerAvatarUrl:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=120&auto=format&fit=crop&q=60',
    pointsReward: 'Cộng 03 điểm rèn luyện mục V.b',
    quotaText: '300 sinh viên',
    timeAgo: '5h trước',
    isFollowed: false,
    isSaved: true,
    isModerationRequired: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'evt-3',
    title:
      'TẬP HUẤN KỸ NĂNG VÀ HƯỚNG DẪN HỒ SƠ DANH HIỆU "SINH VIÊN 5 TỐT" CÁC CẤP NĂM 2026',
    description:
      'Chương trình hỗ trợ sinh viên tháo gỡ mọi khó khăn về việc minh chứng và hoàn thiện 5 tiêu chí: Đạo đức tốt, Học tập tốt, Thể lực tốt, Tình nguyện tốt và Hội nhập tốt. Diễn giả là các thủ khoa SV5T cấp Trung ương.',
    category: 'WORKSHOP',
    status: 'PUBLISHED',
    bannerUrl:
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&auto=format&fit=crop&q=80',
    startTime: '05/10/2026 · 08:00',
    endTime: '11:30',
    location: {
      type: 'OFFLINE',
      address: 'Hội trường Lớn',
      city: 'Khu II ĐHCT',
    },
    capacity: 450,
    registeredCount: 410,
    price: 0,
    organizerId: 'org-hoisinhvien',
    organizerName: 'Hội Sinh viên Trường Đại học Cần Thơ',
    organizerAvatarUrl:
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=120&auto=format&fit=crop&q=60',
    pointsReward: 'Cộng 04 điểm rèn luyện mục II và III',
    quotaText: '450 sinh viên',
    timeAgo: '1 ngày trước',
    isFollowed: true,
    isSaved: false,
    isModerationRequired: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<FeedTabType>('DISCOVER')
  const [events, setEvents] = useState<Event[]>(MOCK_STUDENT_FEED_EVENTS)
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null)

  // Filter events by selected feed tab
  const filteredEvents = events.filter((evt) => {
    if (activeTab === 'FOLLOWING') {
      return evt.isFollowed === true
    }
    if (activeTab === 'RECOMMENDED') {
      // Show events with training points benefits
      return Boolean(evt.pointsReward)
    }
    return true
  })

  const handleRegister = (eventId: string) => {
    // Navigate to registration page or show notification
    navigate(`/events/${eventId}`)
  }

  const handleToggleSave = (eventId: string) => {
    setEvents((prev) =>
      prev.map((evt) =>
        evt.id === eventId ? { ...evt, isSaved: !evt.isSaved } : evt
      )
    )
    setNotificationMessage('Đã cập nhật danh sách sự kiện lưu trữ')
    setTimeout(() => setNotificationMessage(null), 3000)
  }

  const handleToggleFollow = (organizerId: string) => {
    setEvents((prev) =>
      prev.map((evt) =>
        evt.organizerId === organizerId ? { ...evt, isFollowed: !evt.isFollowed } : evt
      )
    )
  }

  const [showMobileLeft, setShowMobileLeft] = useState(false)
  const [showMobileRight, setShowMobileRight] = useState(false)

  return (
    <div className="w-full">
      {/* Toast Notification */}
      {notificationMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-foreground text-background px-4 py-2.5 text-xs font-semibold shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2">
          {notificationMessage}
        </div>
      )}

      {/* Mobile Toolbar (Visible only on smaller screens where sidebars collapse) */}
      <div className="flex lg:hidden items-center justify-between gap-2 mb-4 bg-card border border-border rounded-xl p-2 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setShowMobileLeft(true)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors md:hidden"
        >
          <span>📁 Menu & Đã theo dõi</span>
        </button>

        <button
          type="button"
          onClick={() => setShowMobileRight(true)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-brand-subtle text-primary hover:bg-primary/10 transition-colors"
        >
          <span>📊 Điểm rèn luyện (65/100) & Lịch</span>
        </button>
      </div>

      {/* Mobile Drawer Left */}
      {showMobileLeft && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setShowMobileLeft(false)}
          />
          <div className="relative w-80 max-w-[85%] bg-card p-5 h-full overflow-y-auto shadow-2xl z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="font-bold text-sm text-foreground">Menu & Tổ chức</span>
              <button
                type="button"
                onClick={() => setShowMobileLeft(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>
            <StudentLeftSidebar />
          </div>
        </div>
      )}

      {/* Mobile Drawer Right */}
      {showMobileRight && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setShowMobileRight(false)}
          />
          <div className="relative w-88 max-w-[90%] bg-card p-5 h-full overflow-y-auto shadow-2xl z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="font-bold text-sm text-foreground">Tiến độ ĐRL & Lịch</span>
              <button
                type="button"
                onClick={() => setShowMobileRight(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>
            <StudentRightSidebar />
          </div>
        </div>
      )}

      {/* 3-Column Layout following student_homepage.png */}
      <div className="flex items-start justify-center gap-6 lg:gap-8">
        {/* Left Column: Organization Navigation & Student Tools (Visible from md: 768px+) */}
        <div className="hidden md:block w-56 lg:w-64 shrink-0 sticky top-20 self-start">
          <StudentLeftSidebar />
        </div>

        {/* Center Column: Feed (Tabs + Event Feed Cards) */}
        <main className="flex-1 min-w-0 max-w-2xl flex flex-col gap-6">
          {/* Feed Filter Tabs */}
          <FeedTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Feed List */}
          <div className="flex flex-col gap-6">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <EventFeedCard
                  key={event.id}
                  event={event}
                  onRegister={handleRegister}
                  onToggleSave={handleToggleSave}
                  onToggleFollow={handleToggleFollow}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-border bg-card p-12 text-center flex flex-col items-center justify-center gap-2">
                <span className="text-3xl">🎉</span>
                <h3 className="font-semibold text-foreground text-base">
                  Chưa có sự kiện trong mục này
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Hãy thử chuyển sang tab "Khám phá" để xem các hoạt động mới nhất từ các Đoàn - Hội và CLB.
                </p>
              </div>
            )}
          </div>
        </main>

        {/* Right Column: Training Points Progress & Calendar Widget (Visible from lg: 1024px+) */}
        <div className="hidden lg:block w-72 xl:w-80 shrink-0 sticky top-20 self-start">
          <StudentRightSidebar />
        </div>
      </div>
    </div>
  )
}
