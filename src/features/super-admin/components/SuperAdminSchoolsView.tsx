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
    <div className="space-y-6">
      {/* 1. Header with Breadcrumb */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <span>Dữ liệu danh mục</span>
          <span>/</span>
          <span className="text-primary font-semibold">Khoa/Trường, ngành học</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-k2d font-bold text-foreground tracking-tight">
              Quản lý Khoa/Trường & Ngành học
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Danh mục cơ cấu tổ chức học thuật, các Trường/Khoa trực thuộc và chuyên ngành đào tạo ĐHCT
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenCreateSchoolModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Thêm Khoa/Trường
            </button>
          </div>
        </div>
      </div>

      {/* 2. Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: List of Schools */}
        <div className="lg:col-span-5 bg-white dark:bg-card p-5 rounded-2xl border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-k2d font-bold text-foreground flex items-center gap-2">
              <School className="w-5 h-5 text-primary" />
              Đơn Vị Đào Tạo ({schools.length})
            </h3>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={schoolSearchQuery}
              onChange={(e) => setSchoolSearchQuery(e.target.value)}
              placeholder="Tìm kiếm Khoa/Trường..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-[#F9FAFB] dark:bg-muted focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-sans"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredSchools.map((s) => {
              const isSelected = s.id === selectedSchoolId
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSchoolId(s.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-xs'
                      : 'border-border/70 hover:bg-[#F9FAFB] dark:hover:bg-muted/40'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm leading-snug ${isSelected ? 'font-bold text-primary' : 'font-semibold text-foreground'}`}>
                      {s.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {s.majors?.length || s.majorsCount || 0} chuyên ngành trực thuộc
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenEditSchoolModal(s)
                      }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted transition-colors cursor-pointer"
                      title="Chỉnh sửa thông tin trường"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column: Majors of Selected School */}
        <div className="lg:col-span-7 bg-white dark:bg-card p-6 rounded-2xl border border-border shadow-sm space-y-5">
          {selectedSchool ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border gap-3">
                <div>
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">Chi Tiết Đơn Vị</span>
                  <h3 className="text-xl font-k2d font-bold text-foreground mt-0.5">{selectedSchool.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedSchool.description || 'Chưa có thông tin mô tả chi tiết.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenCreateMajorModal(selectedSchool.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shrink-0 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm Chuyên Ngành
                </button>
              </div>

              {/* Majors Table */}
              <div>
                <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                  Danh Sách Chuyên Ngành Đào Tạo ({selectedSchool.majors?.length || 0})
                </h4>

                {(!selectedSchool.majors || selectedSchool.majors.length === 0) ? (
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
                          <tr key={m.id} className="hover:bg-[#F9FAFB] dark:hover:bg-muted/20 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-semibold text-foreground">{m.code}</td>
                            <td className="py-2.5 px-3 font-semibold text-foreground">{m.name}</td>
                            <td className="py-2.5 px-3 text-muted-foreground">
                              {m.studentCount ? `${m.studentCount} SV` : 'Chưa có SV'}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                Đang đào tạo
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => onOpenEditMajorModal(m)}
                                className="p-1 rounded-md text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                                title="Chỉnh sửa ngành học"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
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
            <p className="text-center text-muted-foreground py-10">Vui lòng chọn một Khoa/Trường để xem chi tiết.</p>
          )}
        </div>
      </div>
    </div>
  )
}
