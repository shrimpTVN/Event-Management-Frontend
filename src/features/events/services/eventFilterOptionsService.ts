import { apiClient } from '@/shared'

export interface FilterOption {
  id: number | string
  label: string
  avatarUrl?: string
  childIds?: (number | string)[]
  childNames?: string[]
  keywords?: string[]
  note?: string
  level?: number
  parentCategoryId?: number | string
}

export interface SemesterOption extends FilterOption {
  number?: number
  academicYear?: string
  academicYearId?: number | string
  shortLabel?: string
}

export interface EventFilterOptions {
  academicYears: FilterOption[]
  semesters: SemesterOption[]
  eventTypes: FilterOption[]
  fanpages: FilterOption[]
  criterias: FilterOption[]
  pointCategories: FilterOption[]
}

export const eventFilterOptionsService = {
  async getFilterOptions(): Promise<EventFilterOptions> {
    const [academicYearsRes, semestersRes, eventTypesRes, fanpagesRes, criteriasRes, pointCategoriesRes] =
      await Promise.allSettled([
        apiClient.get('/academic-years'),
        apiClient.get('/semesters'),
        apiClient.get('/event-types'),
        apiClient.get('/fanpages', { params: { size: 100 } }),
        apiClient.get('/criterias'),
        apiClient.get('/point-categories'),
      ])

    // 1. Academic Years
    const rawAcademicYears =
      academicYearsRes.status === 'fulfilled'
        ? Array.isArray(academicYearsRes.value)
          ? academicYearsRes.value
          : (academicYearsRes.value as any)?.data || []
        : []

    let academicYears: FilterOption[] = rawAcademicYears.map((ay: any) => {
      const codeStr = ay.code ? ay.code.replace('-', ' - ') : `Năm học ${ay.id}`
      return {
        id: ay.id,
        label: codeStr,
        note: ay.code,
      }
    })

    // 2. Semesters
    const rawSemesters =
      semestersRes.status === 'fulfilled'
        ? Array.isArray(semestersRes.value)
          ? semestersRes.value
          : (semestersRes.value as any)?.data || []
        : []

    const semesters: SemesterOption[] = rawSemesters.map((s: any) => {
      const numStr = s.number === 3 ? 'Hè' : String(s.number || 1)
      const matchedYear = rawAcademicYears.find((ay: any) => ay.id === s.academicYearId)
      const rawYearCode = s.academicYear || matchedYear?.code || ''
      const yearStr = rawYearCode ? rawYearCode.replace('-', ' - ') : ''
      return {
        id: s.id,
        number: s.number,
        label: yearStr ? `HK${numStr} - NH ${yearStr}`.trim() : `HK${numStr}`,
        shortLabel: `HK${numStr}`,
        academicYear: yearStr,
        academicYearId: s.academicYearId,
      }
    })

    if (academicYears.length === 0) {
      const uniqueYears = Array.from(new Set(semesters.map((s) => s.academicYear).filter(Boolean)))
      academicYears = uniqueYears.map((yr, idx) => ({
        id: idx + 1,
        label: yr as string,
        note: (yr as string).replace(/\s+/g, ''),
      }))
    }

    // 3. Event Types
    const rawEventTypes =
      eventTypesRes.status === 'fulfilled'
        ? Array.isArray(eventTypesRes.value)
          ? eventTypesRes.value
          : (eventTypesRes.value as any)?.data || []
        : []

    let eventTypes: FilterOption[] = rawEventTypes.map((et: any) => ({
      id: et.id,
      label: et.name || `Loại ${et.id}`,
    }))

    // Fallback standard event types if API is blocked (e.g. 401 unauthenticated) or empty
    if (eventTypes.length === 0) {
      eventTypes = [
        { id: 1, label: 'Workshop' },
        { id: 2, label: 'Giao lưu' },
        { id: 3, label: 'Thể thao' },
        { id: 4, label: 'Tình nguyện' },
        { id: 5, label: 'Học thuật' },
        { id: 6, label: 'Tọa đàm' },
        { id: 7, label: 'Cuộc thi' },
        { id: 8, label: 'Hướng nghiệp' },
        { id: 9, label: 'Văn nghệ' },
        { id: 10, label: 'Tuyên dương' },
        { id: 11, label: 'Chào tân' },
        { id: 12, label: 'Đoàn - Hội' },
        { id: 13, label: 'Kỹ năng' },
        { id: 14, label: 'Hội nhập' },
        { id: 15, label: 'Hiến máu' },
        { id: 16, label: 'Môi trường' },
        { id: 17, label: 'Triển lãm' },
        { id: 18, label: 'Đối thoại' },
      ]
    }

    // 4. Fanpages with Avatar & Name
    const rawFanpagesData: any =
      fanpagesRes.status === 'fulfilled' ? fanpagesRes.value : null
    const rawFanpages = Array.isArray(rawFanpagesData)
      ? rawFanpagesData
      : rawFanpagesData?.content || rawFanpagesData?.data || []

    const fanpages: FilterOption[] = rawFanpages.map((fp: any) => ({
      id: fp.id,
      label: fp.name || fp.title || `Fanpage #${fp.id}`,
      avatarUrl:
        fp.avatarUrl ||
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=80&auto=format&fit=crop&q=60',
    }))

    // 5. Criterias (Tiêu chuẩn SV5T lớn: Đạo đức tốt, Học tập tốt, Thể lực tốt, Tình nguyện tốt, Hội nhập tốt)
    const rawCriterias =
      criteriasRes.status === 'fulfilled'
        ? Array.isArray(criteriasRes.value)
          ? criteriasRes.value
          : (criteriasRes.value as any)?.data || []
        : []

    // If root criteria is wrapper "Danh hiệu SV5T ĐHCT", extract its 5 major children
    let majorCriterias = rawCriterias
    if (
      rawCriterias.length === 1 &&
      Array.isArray(rawCriterias[0]?.children) &&
      rawCriterias[0].children.length > 0
    ) {
      majorCriterias = rawCriterias[0].children
    }

    let criterias: FilterOption[] = majorCriterias.map((c: any) => {
      const childIds: (number | string)[] = [c.id]
      const childNames: string[] = []
      if (c.name) childNames.push(c.name.toLowerCase())

      const collect = (children: any[]) => {
        children.forEach((ch) => {
          if (!ch) return
          childIds.push(ch.id)
          if (ch.name) childNames.push(ch.name.toLowerCase())
          if (Array.isArray(ch.children) && ch.children.length > 0) {
            collect(ch.children)
          }
        })
      }
      if (Array.isArray(c.children) && c.children.length > 0) {
        collect(c.children)
      }

      const rawName = c.name || `Tiêu chuẩn ${c.id}`
      // Tên ngắn gọn cho chip: "Tiêu chuẩn 1: Đạo đức tốt" -> "Đạo đức tốt"
      const shortName = rawName.replace(/^Tiêu chuẩn\s*\d*[:\s-]*/i, '').trim() || rawName

      const sLower = shortName.toLowerCase()
      const keywords: string[] = []
      if (sLower.includes('đạo đức')) keywords.push('đạo đức', 'lối sống', 'tư tưởng', 'chính trị')
      else if (sLower.includes('học tập')) keywords.push('học tập', 'học thuật', 'nghiên cứu', 'tín chỉ')
      else if (sLower.includes('thể lực')) keywords.push('thể lực', 'thể thao', 'thể dục')
      else if (sLower.includes('tình nguyện')) keywords.push('tình nguyện', 'hiến máu')
      else if (sLower.includes('hội nhập')) keywords.push('hội nhập', 'ngoại ngữ', 'tin học', 'kỹ năng')

      return {
        id: c.id,
        label: shortName,
        note: rawName,
        childIds,
        childNames,
        keywords,
      }
    })

    // Fallback standard criteria if API is blocked or empty
    if (criterias.length === 0) {
      criterias = [
        {
          id: 10,
          label: 'Đạo đức tốt',
          note: 'Tiêu chuẩn Đạo đức tốt',
          childIds: [10, 101, 102, 103, 1031, 1032, 1033, 1034, 1035],
          keywords: ['đạo đức', 'lối sống', 'tư tưởng'],
        },
        {
          id: 20,
          label: 'Học tập tốt',
          note: 'Tiêu chuẩn Học tập tốt',
          childIds: [20, 201, 202],
          keywords: ['học tập', 'học thuật'],
        },
        {
          id: 30,
          label: 'Thể lực tốt',
          note: 'Tiêu chuẩn Thể lực tốt',
          childIds: [30, 301, 302],
          keywords: ['thể lực', 'thể thao'],
        },
        {
          id: 40,
          label: 'Tình nguyện tốt',
          note: 'Tiêu chuẩn Tình nguyện tốt',
          childIds: [40, 401, 402, 403],
          childNames: [
            'được các cấp đảng, đoàn, hội, chính quyền khen thưởng trong hoạt động tình nguyện',
            'tham gia ít nhất 03 ngày tình nguyện trong năm học',
            'tham gia ít nhất 02 lần hiến máu tình nguyện trong năm học',
          ],
          keywords: ['tình nguyện', 'hiến máu'],
        },
        {
          id: 50,
          label: 'Hội nhập tốt',
          note: 'Tiêu chuẩn Hội nhập tốt',
          childIds: [50, 501, 502, 503, 5011, 5012, 5013, 5014, 5015, 5021, 5022, 5023, 5024, 5025, 5026, 5031, 5032, 5033, 5034, 5035],
          keywords: ['hội nhập', 'ngoại ngữ', 'tin học'],
        },
      ]
    }

    // 6. Point Categories (Chỉ lấy các mục lớn: Mục I, Mục I.a, Mục II.b... KHÔNG lấy tên dài)
    const rawPointCategories =
      pointCategoriesRes.status === 'fulfilled'
        ? Array.isArray(pointCategoriesRes.value)
          ? pointCategoriesRes.value
          : (pointCategoriesRes.value as any)?.data || []
        : []

    // Build parent-child tree mapping for point categories
    const childrenMap = new Map<number | string, (number | string)[]>()
    rawPointCategories.forEach((pc: any) => {
      if (pc.parentCategoryId) {
        const list = childrenMap.get(pc.parentCategoryId) || []
        list.push(pc.id)
        childrenMap.set(pc.parentCategoryId, list)
      }
    })

    const getAllDescendantIds = (parentId: number | string): (number | string)[] => {
      const descendants: (number | string)[] = [parentId]
      const directChildren = childrenMap.get(parentId) || []
      directChildren.forEach((cid) => {
        descendants.push(...getAllDescendantIds(cid))
      })
      return descendants
    }

    // Filter main categories: Level 0 or Level 1
    const majorCategories = rawPointCategories.filter(
      (pc: any) => pc.level === 0 || pc.level === 1
    )

    const pointCategories: FilterOption[] = majorCategories.map((pc: any) => {
      const isRoot = pc.level === 0 || !pc.parentCategoryId
      let codeLabel = ''
      if (pc.note) {
        const match = pc.note.match(/(?:Mã tiêu chí:\s*)?([I|V|X]+(?:\.[a-z0-9]+)?)/i)
        if (match && match[1]) {
          codeLabel = match[1]
        }
      }
      if (!codeLabel) {
        const nameMatch = pc.name?.match(/(?:Mục|Điều)\s*([I|V|X0-9]+(?:\.[a-z0-9]+)?)/i)
        if (nameMatch && nameMatch[1]) {
          codeLabel = nameMatch[1]
        }
      }

      let displayLabel = ''
      if (isRoot) {
        const nameLower = (pc.name || '').toLowerCase()
        let shortSuffix = ''
        if (nameLower.includes('học tập')) shortSuffix = 'Học tập'
        else if (nameLower.includes('nội quy') || nameLower.includes('quy chế')) shortSuffix = 'Kỷ luật'
        else if (nameLower.includes('chính trị') || nameLower.includes('văn hóa') || nameLower.includes('thể thao')) shortSuffix = 'Hoạt động'
        else if (nameLower.includes('công dân') || nameLower.includes('cộng đồng')) shortSuffix = 'Cộng đồng'
        else if (nameLower.includes('phụ trách') || nameLower.includes('đoàn thể')) shortSuffix = 'Đoàn thể'

        const romanNumber = ['I', 'II', 'III', 'IV', 'V'][Number(pc.id) - 1] || codeLabel || String(pc.id)
        displayLabel = shortSuffix ? `Mục ${romanNumber} · ${shortSuffix}` : `Mục ${romanNumber}`
      } else {
        displayLabel = codeLabel ? `Mục ${codeLabel}` : `Mục ${pc.id}`
      }

      return {
        id: pc.id,
        label: displayLabel,
        note: pc.name,
        level: isRoot ? 0 : 1,
        parentCategoryId: pc.parentCategoryId,
        childIds: getAllDescendantIds(pc.id),
      }
    })

    return {
      academicYears,
      semesters,
      eventTypes,
      fanpages,
      criterias,
      pointCategories,
    }
  },
}
