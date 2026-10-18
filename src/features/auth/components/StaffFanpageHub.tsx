import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Plus, Info, Check, X, CheckCircle2 } from 'lucide-react'

interface FanpageInvitation {
  id: string
  code: string
  name: string
  inviter: string
  role: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
}

interface JoinedFanpage {
  id: string
  code: string
  name: string
  role: string
  permissions: string
}

const INITIAL_INVITATIONS: FanpageInvitation[] = [
  {
    id: 'inv-1',
    code: 'KHTN',
    name: 'Fanpage Khoa Khoa học Tự nhiên',
    inviter: 'Ban Truyền thông CTU',
    role: 'Quản trị viên sự kiện',
    status: 'PENDING',
  },
  {
    id: 'inv-2',
    code: 'CTSV',
    name: 'Fanpage Trung tâm Hỗ trợ Sinh viên',
    inviter: 'Phòng Công tác Sinh viên',
    role: 'Biên tập viên nội dung',
    status: 'PENDING',
  },
]

const JOINED_FANPAGES: JoinedFanpage[] = [
  {
    id: 'fp-1',
    code: 'CTU',
    name: 'Fanpage Trường Đại học Cần Thơ',
    role: 'Quản trị viên chính',
    permissions: 'Quản lý sự kiện, nội dung, đối soát',
  },
  {
    id: 'fp-2',
    code: 'CNTT',
    name: 'Fanpage Khoa CNTT',
    role: 'Biên tập viên',
    permissions: 'Đăng bài, duyệt nội dung, theo dõi tương tác',
  },
  {
    id: 'fp-3',
    code: 'CLB',
    name: 'Fanpage CLB Công nghệ phần mềm CTU',
    role: 'Người quản lý sự kiện',
    permissions: 'Tạo sự kiện, theo dõi đăng ký, báo cáo',
  },
]

export const StaffFanpageHub: React.FC = () => {
  const navigate = useNavigate()
  const [invitations, setInvitations] = useState<FanpageInvitation[]>(INITIAL_INVITATIONS)
  const [selectedFanpageId, setSelectedFanpageId] = useState<string>('fp-1')
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  const handleRespondInvitation = (id: string, accept: boolean) => {
    setInvitations((prev) =>
      prev.map((inv) =>
        inv.id === id ? { ...inv, status: accept ? 'ACCEPTED' : 'REJECTED' } : inv
      )
    )
    const target = invitations.find((i) => i.id === id)
    if (target) {
      setActionNotice(
        accept
          ? `Đã chấp nhận lời mời tham gia quản trị "${target.name}"`
          : `Đã từ chối lời mời "${target.name}"`
      )
      setTimeout(() => setActionNotice(null), 4000)
    }
  }

  const handleContinue = () => {
    // Navigate to event management home under selected fanpage
    navigate('/fanpage/admin')
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-background py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
      <div className="max-w-[1200px] mx-auto w-full space-y-4">
        {/* Top Back Navigation (Figma: top-status-nav) */}
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#4B5563] dark:text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại</span>
          </button>
        </div>

        {/* Sync Banner Notice (Figma: sync-banner [1200x76]) */}
        <div className="flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl bg-white dark:bg-card border border-[#E5E7EB] dark:border-border shadow-xs text-left">
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <Info className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h3 className="font-bold text-sm text-[#0B1626] dark:text-foreground">
              Trung tâm quản lý fanpage dành cho cán bộ
            </h3>
            <p className="text-xs text-[#4B5563] dark:text-muted-foreground leading-relaxed">
              Chọn fanpage để tiếp tục quản lý sự kiện, nhận quyền mới hoặc tạo fanpage mới nếu chưa có trong danh sách.
            </p>
          </div>
        </div>

        {actionNotice && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Main Content Card (Figma: form-card [1200x1020]) */}
        <div className="w-full bg-white dark:bg-card rounded-2xl border border-[#E5E7EB] dark:border-border p-6 sm:p-10 shadow-sm space-y-8 text-left">
          {/* Card Header */}
          <div className="pb-6 border-b border-[#F3F4F6] dark:border-border">
            <h1 className="font-k2d font-bold text-2xl sm:text-3xl text-[#0B1626] dark:text-foreground tracking-tight">
              Chọn fanpage để quản lý sự kiện
            </h1>
            <p className="font-sans text-sm text-[#4B5563] dark:text-muted-foreground mt-2 leading-relaxed">
              Sau khi hồ sơ được duyệt, bạn có thể chọn fanpage hiện có để tiếp tục quản lý sự kiện hoặc tạo fanpage mới nếu chưa có trong danh sách.
            </p>
          </div>

          {/* I. THÔNG BÁO (Invitations) */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0B1626] dark:text-foreground">
              I. THÔNG BÁO
            </h2>

            <div className="space-y-3">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 rounded-xl border border-[#E5E7EB] dark:border-border bg-[#F9FAFB] dark:bg-background/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="h-11 w-11 rounded-xl bg-primary text-primary-foreground font-k2d font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                      {inv.code}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">{inv.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Người mời:{' '}
                        <span className="font-medium text-foreground">{inv.inviter}</span> • Vai trò:{' '}
                        <span className="font-medium text-primary">{inv.role}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {inv.status === 'PENDING' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleRespondInvitation(inv.id, true)}
                          className="px-4 h-9 rounded-lg bg-[#1B4B8A] hover:bg-[#1E40AF] text-white font-semibold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Chấp nhận</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRespondInvitation(inv.id, false)}
                          className="px-3.5 h-9 rounded-lg border border-[#D1D5DB] dark:border-border text-[#4B5563] dark:text-muted-foreground hover:bg-muted font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Từ chối</span>
                        </button>
                      </>
                    ) : (
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-md ${
                          inv.status === 'ACCEPTED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {inv.status === 'ACCEPTED' ? 'Đã chấp nhận' : 'Đã từ chối'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* II. DANH SÁCH FANPAGE ĐÃ THAM GIA */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0B1626] dark:text-foreground">
              II. DANH SÁCH FANPAGE ĐÃ THAM GIA
            </h2>

            <div className="space-y-3">
              {JOINED_FANPAGES.map((fp) => {
                const isSelected = selectedFanpageId === fp.id
                return (
                  <div
                    key={fp.id}
                    onClick={() => setSelectedFanpageId(fp.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      isSelected
                        ? 'border-primary bg-primary/[0.03] shadow-xs ring-1 ring-primary/20'
                        : 'border-[#E5E7EB] dark:border-border bg-white dark:bg-card hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="h-11 w-11 rounded-xl bg-slate-800 text-white font-k2d font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                        {fp.code}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-foreground">{fp.name}</h4>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                              Đang chọn
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Vai trò:{' '}
                          <span className="font-medium text-foreground">{fp.role}</span> • Quyền:{' '}
                          <span className="text-[#4B5563] dark:text-muted-foreground">{fp.permissions}</span>
                        </p>
                      </div>
                    </div>

                    <Link
                      to="/fanpage/admin"
                      onClick={(e) => e.stopPropagation()}
                      className="px-4 h-9 rounded-lg border border-[#D1D5DB] dark:border-border text-foreground hover:bg-[#F9FAFB] dark:hover:bg-muted font-medium text-xs transition-colors self-end sm:self-center shrink-0 flex items-center gap-1.5"
                    >
                      <span>Đi tới trang quản lý</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>

          {/* III. TẠO FANPAGE MỚI */}
          <div className="p-5 rounded-xl border border-dashed border-[#D1D5DB] dark:border-border bg-[#F9FAFB] dark:bg-background/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-[#0B1626] dark:text-foreground">
                III. TẠO FANPAGE MỚI
              </h3>
              <p className="text-xs text-[#4B5563] dark:text-muted-foreground leading-relaxed max-w-2xl">
                Chưa có fanpage trong danh sách? Tạo fanpage mới để gắn nhãn thương hiệu CTU và bắt đầu quản lý sự kiện ngay sau khi được duyệt.
              </p>
            </div>

            <Link
              to="/register/fanpage"
              className="px-5 h-10 rounded-lg bg-[#1B4B8A] hover:bg-[#1E40AF] text-white font-semibold text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Tạo fanpage mới</span>
            </Link>
          </div>

          {/* Bottom Actions Row */}
          <div className="pt-6 border-t border-[#E5E7EB] dark:border-border flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-xs text-[#6B7280] dark:text-muted-foreground max-w-lg leading-relaxed text-left">
              Sau khi chọn fanpage hoặc tạo mới, bạn sẽ được chuyển đến trang quản lý sự kiện của fanpage đó để tiếp tục công việc.
            </p>

            <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full md:w-auto px-6 h-11 rounded-lg border border-[#D1D5DB] dark:border-border text-foreground hover:bg-[#F9FAFB] dark:hover:bg-muted font-medium text-sm transition-colors cursor-pointer"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={handleContinue}
                className="w-full md:w-auto px-6 h-11 rounded-lg bg-[#1B4B8A] hover:bg-[#1E40AF] text-white font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <span>Tiếp tục quản lý</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CTU Portal Footer */}
      <div className="mt-8 text-center text-xs text-[#6B7280] dark:text-muted-foreground space-y-1">
        <p className="font-medium text-foreground/80">
          Đại học Cần Thơ (CTU) • Hệ thống quản lý sự kiện
        </p>
        <p>
          Quản trị hệ thống sự kiện CTU | Hotline:{' '}
          <span className="font-medium text-foreground/80">(0292) 3832 663</span> | Email:{' '}
          <span className="text-primary font-medium">social-admin@ctu.edu.vn</span>
        </p>
      </div>
    </div>
  )
}
