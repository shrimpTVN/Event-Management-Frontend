import { Tooltip } from '@/components/ui/tooltip'
import { AdminBadge } from './AdminDetails'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import React, { useState } from 'react'
import { School, GraduationCap, Plus, Edit2, Search, ChevronRight } from 'lucide-react'
import type { SuperAdminSchool, SuperAdminMajor } from '../types/superAdmin.types'

interface SuperAdminSchoolsViewProps {
  schools: SuperAdminSchool[]
  onOpenCreateSchoolModal: () => void
  onOpenEditSchoolModal: (school: SuperAdminSchool) => void
  onOpenCreateMajorModal: (schoolId: number) => void
  onOpenEditMajorModal: (major: SuperAdminMajor) => void
}

export const SuperAdminSchoolsView: React.FC<SuperAdminSchoolsViewProps> = ({
  schools,
  onOpenCreateSchoolModal,
  onOpenEditSchoolModal,
  onOpenCreateMajorModal,
  onOpenEditMajorModal,
}) => {
  const [selectedSchoolId, setSelectedSchoolId] = useState<number>(schools[0]?.id || 1)
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('')

  const filteredSchools = schools.filter((s) =>
    s.name.toLowerCase().includes(schoolSearchQuery.toLowerCase())
  )

  const selectedSchool = schools.find((s) => s.id === selectedSchoolId) || schools[0]

  return (
    <div className="w-full flex flex-col gap-6 text-left animate-in fade-in duration-300">
      {/* 1. Header with Breadcrumb & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <span>Dữ liệu danh mục</span>
            <span>/</span>
            <span className="text-foreground font-semibold">Khoa/Trường, ngành học</span>
          </p>
          <h1 className="font-k2d font-bold text-2xl text-foreground mt-1">
            Quản lý Khoa/Trường &amp; Ngành học
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Danh mục cơ cấu tổ chức học thuật, các Trường/Khoa trực thuộc và chuyên ngành đào tạo
            ĐHCT.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={onOpenCreateSchoolModal}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-lg bg-[#1B4B8A] hover:bg-[#1E40AF] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Khoa/Trường</span>
          </Button>
        </div>
      </div>

      {/* 2. Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: List of Schools */}
        <div className="lg:col-span-5 bg-white dark:bg-card p-5 rounded-2xl border border-[#E5E7EB] dark:border-border shadow-2xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-k2d font-bold text-foreground flex items-center gap-2">
              <School className="w-4 h-4 text-primary" />
              Đơn Vị Đào Tạo ({schools.length})
            </h3>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              value={schoolSearchQuery}
              onChange={(e) => setSchoolSearchQuery(e.target.value)}
              placeholder="Tìm kiếm Khoa/Trường..."
              className="w-full pl-9 pr-3 h-9 text-xs rounded-xl border border-[#E5E7EB] dark:border-border bg-[#F9FAFB] dark:bg-muted focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-sans"
            />
          </div>

          <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredSchools.map((s) => {
              const isSelected = s.id === selectedSchoolId
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSchoolId(s.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-[#1B4B8A] bg-primary/5 dark:bg-primary/10 shadow-xs'
                      : 'border-border/70 hover:bg-[#F9FAFB] dark:hover:bg-muted/40'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <Tooltip content={s.name}>
                      <p
                        className={`text-xs leading-snug ${isSelected ? 'font-bold text-primary' : 'font-semibold text-foreground'}`}
                      >
                        {s.name}
                      </p>
                    </Tooltip>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {s.majors?.length || s.majorsCount || 0} chuyên ngành trực thuộc
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Tooltip content="Chỉnh sửa thông tin trường">
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpenEditSchoolModal(s)
                        }}
                        className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted transition-colors cursor-pointer"
                        aria-label="Chỉnh sửa thông tin trường"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    </Tooltip>
                    <ChevronRight
                      className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column: Majors of Selected School */}
        <div className="lg:col-span-7 bg-white dark:bg-card p-6 rounded-2xl border border-[#E5E7EB] dark:border-border shadow-2xs flex flex-col gap-5">
          {selectedSchool ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border gap-3">
                <div>
                  <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                    Chi Tiết Đơn Vị
                  </span>
                  <h3 className="text-lg font-k2d font-bold text-foreground mt-0.5">
                    {selectedSchool.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedSchool.description || 'Chưa có thông tin mô tả chi tiết.'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => onOpenCreateMajorModal(selectedSchool.id)}
                  className="flex items-center gap-1.5 px-3.5 h-9 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors shrink-0 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Chuyên Ngành</span>
                </Button>
              </div>

              {/* Majors Table */}
              <div>
                <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-muted-foreground" />
                  Danh Sách Chuyên Ngành Đào Tạo ({selectedSchool.majors?.length || 0})
                </h4>

                {!selectedSchool.majors || selectedSchool.majors.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center bg-[#F9FAFB] dark:bg-muted/20 rounded-xl">
                    Chưa có ngành học nào được cấu hình cho đơn vị này.
                  </p>
                ) : (
                  <div className="border border-border rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#F9FAFB] dark:bg-muted/40 text-[11px] font-bold uppercase text-muted-foreground border-b border-border">
                          <th className="py-2.5 px-3">Mã Ngành</th>
                          <th className="py-2.5 px-3">Tên Chuyên Ngành</th>
                          <th className="py-2.5 px-3">Sinh Viên</th>
                          <th className="py-2.5 px-3">Trạng Thái</th>
                          <th className="py-2.5 px-3 text-right">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-xs">
                        {selectedSchool.majors.map((m) => (
                          <tr
                            key={m.id}
                            className="hover:bg-[#F9FAFB] dark:hover:bg-muted/20 transition-colors"
                          >
                            <td className="py-2.5 px-3 font-mono font-semibold text-foreground">
                              {m.code || '—'}
                            </td>
                            <Tooltip content={m.name}>
                              <td className="py-2.5 px-3 font-semibold text-foreground">
                                {m.name}
                              </td>
                            </Tooltip>
                            <td className="py-2.5 px-3 text-muted-foreground">
                              {m.studentCount == null ? '—' : `${m.studentCount} SV`}
                            </td>
                            <td className="py-2.5 px-3">
                              <AdminBadge dot tone={m.isActive ? 'success' : 'neutral'}>
                                {m.isActive ? 'Đang đào tạo' : 'Tạm ngừng'}
                              </AdminBadge>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <Tooltip content="Chỉnh sửa ngành học">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  type="button"
                                  onClick={() => onOpenEditMajorModal(m)}
                                  className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                                  aria-label="Chỉnh sửa ngành học"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                              </Tooltip>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-10">
              Vui lòng chọn một Khoa/Trường để xem chi tiết.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
