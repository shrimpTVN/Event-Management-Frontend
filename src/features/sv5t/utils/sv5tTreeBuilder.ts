import type { CriteriaProgressNode, StudentCriteriaProgressResponse } from '../types/sv5t.types'

/**
 * Canonical descriptions / requirements for each SV5T criteria ID.
 * Based on docs/materials/seed_criterias_sv5t.sql.
 */
export const SV5T_CRITERIA_GUIDES: Record<number, string> = {
  10: 'Đạt đủ 03 tiêu chuẩn: (1.1), (1.2) và (1.3)',
  101: 'Điểm rèn luyện TBC học kỳ 3 năm học trước, học kỳ 1 và 2 năm học xét đạt từ 85 điểm trở lên (SV năm nhất chỉ xét HK1 và HK2)',
  102: 'Không vi phạm pháp luật và các quy chế, nội quy của nhà trường, địa phương và cộng đồng',
  103: 'Đạt ít nhất 01 tiêu chí trong 05 tiêu chí bên dưới (1.3.1 đến 1.3.5)',
  1031: 'Tham gia cuộc thi tìm hiểu về các môn khoa học chính trị, tư tưởng Hồ Chí Minh do Đoàn - Hội cấp cơ sở trở lên tổ chức',
  1032: 'Tham gia hoạt động giáo dục lòng yêu nước, tinh thần tự hào dân tộc: tham quan di tích, bảo tàng; thăm hỏi mẹ VNAH; thắp nến tri ân; hội thi hát ca khúc truyền thống; hoạt động biên giới hải đảo...',
  1033: 'Tham gia hoạt động giáo dục đạo đức, lối sống văn hóa cho sinh viên',
  1034: 'Là thanh niên tiêu biểu trong học tập và làm theo lời Bác',
  1035: 'Là Đảng viên hoàn thành tốt nhiệm vụ',
  20: 'Điểm trung bình cộng năm học đạt từ 3.0 trở lên, không nợ học phần',
  201: 'Điểm TBC học kỳ 3 năm trước, HK1 và HK2 năm học xét đạt từ 3.0 trở lên (SV năm nhất xét HK1 và HK2)',
  202: 'Số tín chỉ mỗi HK >= 12 tín chỉ (trường hợp đặc biệt do Hội đồng ĐHCT xem xét); không bị nợ học phần',
  30: 'Đạt 01 trong 02 tiêu chuẩn (3.1) hoặc (3.2)',
  301: 'Học ít nhất 01 học phần Giáo dục thể chất có rèn luyện thể lực đạt điểm B trở lên',
  302: 'Tham gia ít nhất 01 hoạt động rèn luyện thể lực do Đoàn - Hội cấp cơ sở trở lên tổ chức (thể dục, thể thao, dân vũ...)',
  40: 'Đạt 01 trong 03 tiêu chuẩn (4.1), (4.2) hoặc (4.3)',
  401: 'Được các cấp Đảng, Đoàn, Hội, chính quyền khen thưởng trong hoạt động tình nguyện',
  402: 'Tham gia ít nhất 03 ngày tình nguyện trong năm học',
  403: 'Tham gia ít nhất 02 lần hiến máu tình nguyện trong năm học',
  50: 'Đạt 02 trong 03 tiêu chuẩn: Ngoại ngữ, Tin học, Hoạt động hội nhập',
  501: 'Ngoại ngữ: Đạt 01 trong 05 tiêu chí sau',
  5011: 'Được khen thưởng cuộc thi ngoại ngữ cấp Đại học Cần Thơ trở lên',
  5012: 'Đạt chứng chỉ ngoại ngữ theo bảng quy đổi chuẩn CEFR (IELTS, TOEIC, TOEFL, DELF, HSK, TOPIK, JLPT...)',
  5013: 'Sinh viên năm thứ hai: Đã hoàn thành hoặc được miễn 03 học phần Ngoại ngữ căn bản',
  5014: 'Sinh viên năm thứ nhất: Đã hoàn thành hoặc được miễn 02 học phần Ngoại ngữ căn bản trở lên',
  5015: 'Sinh viên chuyên ngành ngoại ngữ: Điểm TBC học tập năm học xét đạt từ 3.2 trở lên (SV năm nhất xét HK1, HK2)',
  502: 'Tin học: Đạt 01 trong 06 tiêu chí sau',
  5021: 'Đạt chứng chỉ Ứng dụng công nghệ thông tin cơ bản trở lên do Đại học Cần Thơ cấp',
  5022: 'Đạt chứng chỉ tin học quốc tế IC3 hoặc MOS (Word, Excel, PowerPoint)',
  5023: 'Được cấp giấy khen hoặc giấy chứng nhận tham gia cuộc thi tin học do Đoàn cấp cơ sở trở lên tổ chức',
  5024: 'Điểm trung bình của 2 học phần Năng lực số ứng dụng và Thực hành năng lực số ứng dụng đạt từ B trở lên',
  5025: 'Học ít nhất 01 học phần/khóa học CNTT đạt từ B / 7.0 trở lên hoặc hoàn thành khóa UDCNTT cơ bản ĐHCT',
  5026: 'Sinh viên chuyên ngành Công nghệ thông tin: Điểm TBC học tập năm học xét đạt từ 3.2 trở lên (SV năm nhất xét HK1 và HK2)',
  503: 'Tham gia các hoạt động, phong trào nâng cao kỹ năng hội nhập: Đạt 01 trong 05 tiêu chí sau',
  5031: 'Tham gia 02 hoạt động hội nhập do cấp Đại học Cần Thơ trở lên tổ chức (giao lưu quốc tế, trao đổi SV, học thuật...)',
  5032: 'Được Đoàn Thanh niên, Hội Sinh viên cấp ĐHCT trở lên khen thưởng thành tích xuất sắc phong trào TN-SV',
  5033: 'Trực tiếp tổ chức hoặc tham gia ít nhất 01 lớp tập huấn bồi dưỡng kỹ năng do Đoàn-Hội ĐHCT trở lên tổ chức',
  5034: 'Đạt điểm B trở lên học phần kỹ năng (Kỹ năng mềm, ĐMST & khởi nghiệp) và tham gia 01 hoạt động hội nhập ĐHCT',
  5035: 'Đạt giải Ba trở lên trong cuộc thi kiến thức hội nhập hoặc cuộc thi học thuật bằng ngoại ngữ cấp cơ sở/ĐHCT',
}

function isGenericText(str?: string | null): boolean {
  if (!str) return true
  const s = str.trim().toLowerCase()
  return (
    s === 'sinh viên tự đánh giá tiêu chuẩn' ||
    s === 'sinh viên tự đánh giá đạt tiêu chuẩn' ||
    s === 'sinh viên tự đánh giá đạt' ||
    s === 'sinh viên tự đánh giá' ||
    s === 'tự đánh giá'
  )
}

/**
 * 28 Canonical criteria for SV5T based on docs/materials/seed_criterias_sv5t.sql
 */
export const CANONICAL_SV5T_STANDARDS: Array<{
  criteriaId: number
  name: string
  note?: string | null
  requiredChildren: number
  children: Array<{
    criteriaId: number
    name: string
    note?: string | null
    children?: Array<{
      criteriaId: number
      name: string
      note?: string | null
    }>
  }>
}> = [
  // 1. Tiêu chuẩn 1: Đạo đức tốt (ID in DB: 10)
  {
    criteriaId: 10,
    name: 'Tiêu chuẩn 1: Đạo đức tốt',
    note: 'Đạt đủ 03 tiêu chuẩn: (1.1), (1.2) và (1.3)',
    requiredChildren: 3,
    children: [
      {
        criteriaId: 101,
        name: 'Điểm rèn luyện trung bình cộng của học kỳ 3 năm học trước, học kỳ 1 và 2 trong năm học đạt từ 85 điểm trở lên.',
        note: 'SV năm nhất chỉ xét HK1 và HK2',
      },
      {
        criteriaId: 102,
        name: 'Không vi phạm pháp luật và các quy chế, nội quy của nhà trường, quy định của địa phương và cộng đồng.',
        note: null,
      },
      {
        criteriaId: 103,
        name: 'Đạt thêm 01 trong 05 tiêu chí sau:',
        note: 'Đạt ít nhất 01 tiêu chí trong 05 tiêu chí bên dưới (1.3.1 đến 1.3.5)',
        children: [
          {
            criteriaId: 1031,
            name: 'Tham gia cuộc thi tìm hiểu về các môn khoa học chính trị, tư tưởng Hồ Chí Minh do đơn vị Đoàn - Hội cấp cơ sở và tương đương trở lên tổ chức.',
          },
          {
            criteriaId: 1032,
            name: 'Tham gia các hoạt động giáo dục lòng yêu nước, tinh thần tự hào dân tộc: tham quan các di tích lịch sử, bảo tàng; thăm hỏi mẹ Việt Nam Anh hùng; lễ thắp nến tri ân các Anh hùng liệt sĩ; hội thi hát ca khúc truyền thống; hoạt động hướng về biên giới, hải đảo,…',
          },
          {
            criteriaId: 1033,
            name: 'Tham gia hoạt động giáo dục đạo đức, lối sống văn hóa cho sinh viên.',
          },
          {
            criteriaId: 1034,
            name: 'Là thanh niên tiêu biểu trong học tập và làm theo lời Bác',
          },
          {
            criteriaId: 1035,
            name: 'Là Đảng viên hoàn thành tốt nhiệm vụ.',
          },
        ],
      },
    ],
  },
  // 2. Tiêu chuẩn 2: Học tập tốt (ID in DB: 20)
  {
    criteriaId: 20,
    name: 'Tiêu chuẩn 2: Học tập tốt',
    note: 'Điểm trung bình cộng năm học đạt từ 3.0 trở lên, không nợ học phần',
    requiredChildren: 2,
    children: [
      {
        criteriaId: 201,
        name: 'Điểm trung bình cộng năm học xét đạt từ 3.0 trở lên.',
        note: 'Điểm TBC HK3 năm trước, HK1 và HK2 năm xét >= 3.0',
      },
      {
        criteriaId: 202,
        name: 'Tích lũy tối thiểu 12 tín chỉ/học kỳ và không bị nợ học phần ở thời điểm xét.',
        note: 'Số tín chỉ mỗi HK >= 12; không bị nợ học phần',
      },
    ],
  },
  // 3. Tiêu chuẩn 3: Thể lực tốt (ID in DB: 30)
  {
    criteriaId: 30,
    name: 'Tiêu chuẩn 3: Thể lực tốt',
    note: 'Đạt 01 trong 02 tiêu chuẩn: (3.1) hoặc (3.2)',
    requiredChildren: 1,
    children: [
      {
        criteriaId: 301,
        name: 'Học ít nhất 01 học phần Giáo dục thể chất có rèn luyện thể lực đạt điểm B trở lên.',
        note: null,
      },
      {
        criteriaId: 302,
        name: 'Tham gia ít nhất 01 hoạt động rèn luyện thể lực do Đoàn - Hội cấp cơ sở trở lên tổ chức (thể dục, thể thao, dân vũ...).',
        note: null,
      },
    ],
  },
  // 4. Tiêu chuẩn 4: Tình nguyện tốt (ID in DB: 40)
  {
    criteriaId: 40,
    name: 'Tiêu chuẩn 4: Tình nguyện tốt',
    note: 'Đạt 01 trong 03 tiêu chuẩn: (4.1), (4.2) hoặc (4.3)',
    requiredChildren: 1,
    children: [
      {
        criteriaId: 401,
        name: 'Được các cấp Đảng, Đoàn, Hội, chính quyền khen thưởng trong hoạt động tình nguyện.',
        note: null,
      },
      {
        criteriaId: 402,
        name: 'Tham gia ít nhất 03 ngày tình nguyện trong năm học.',
        note: null,
      },
      {
        criteriaId: 403,
        name: 'Tham gia ít nhất 02 lần hiến máu tình nguyện trong năm học.',
        note: null,
      },
    ],
  },
  // 5. Tiêu chuẩn 5: Hội nhập tốt (ID in DB: 50)
  {
    criteriaId: 50,
    name: 'Tiêu chuẩn 5: Hội nhập tốt',
    note: 'Đạt 02 trong 03 tiêu chuẩn: Ngoại ngữ, Tin học, Kỹ năng hội nhập',
    requiredChildren: 2,
    children: [
      {
        criteriaId: 501,
        name: '(5.1) Ngoại ngữ: Đạt 01 trong 05 tiêu chí sau',
        children: [
          {
            criteriaId: 5011,
            name: 'Được khen thưởng cuộc thi ngoại ngữ cấp Đại học Cần Thơ trở lên.',
          },
          {
            criteriaId: 5012,
            name: 'Đạt chứng chỉ ngoại ngữ theo bảng quy đổi chuẩn CEFR (IELTS, TOEIC, TOEFL, DELF, HSK, TOPIK, JLPT...).',
          },
          {
            criteriaId: 5013,
            name: 'Sinh viên năm thứ hai: Đã hoàn thành hoặc được miễn 03 học phần Ngoại ngữ căn bản.',
          },
          {
            criteriaId: 5014,
            name: 'Sinh viên năm thứ nhất: Đã hoàn thành hoặc được miễn 02 học phần Ngoại ngữ căn bản trở lên.',
          },
          {
            criteriaId: 5015,
            name: 'Sinh viên chuyên ngành ngoại ngữ: Điểm TBC học tập năm học xét đạt từ 3.2 trở lên.',
          },
        ],
      },
      {
        criteriaId: 502,
        name: '(5.2) Tin học: Đạt 01 trong 06 tiêu chí sau',
        children: [
          {
            criteriaId: 5021,
            name: 'Đạt chứng chỉ Ứng dụng công nghệ thông tin cơ bản trở lên do Đại học Cần Thơ cấp.',
          },
          {
            criteriaId: 5022,
            name: 'Đạt chứng chỉ tin học quốc tế IC3 hoặc MOS (Word, Excel, PowerPoint).',
          },
          {
            criteriaId: 5023,
            name: 'Được cấp giấy khen hoặc giấy chứng nhận tham gia cuộc thi tin học do Đoàn cấp cơ sở trở lên tổ chức.',
          },
          {
            criteriaId: 5024,
            name: 'Điểm trung bình của 2 học phần Năng lực số ứng dụng và Thực hành năng lực số ứng dụng đạt từ B trở lên.',
          },
          {
            criteriaId: 5025,
            name: 'Học ít nhất 01 học phần/khóa học CNTT đạt từ B / 7.0 trở lên hoặc hoàn thành khóa UDCNTT cơ bản ĐHCT.',
          },
          {
            criteriaId: 5026,
            name: 'Sinh viên chuyên ngành Công nghệ thông tin: Điểm TBC học tập năm học xét đạt từ 3.2 trở lên.',
          },
        ],
      },
      {
        criteriaId: 503,
        name: '(5.3) Tham gia các hoạt động, phong trào nâng cao kỹ năng hội nhập: Đạt 01 trong 05 tiêu chí sau',
        children: [
          {
            criteriaId: 5031,
            name: 'Tham gia 02 hoạt động hội nhập do cấp Đại học Cần Thơ trở lên tổ chức.',
          },
          {
            criteriaId: 5032,
            name: 'Được Đoàn Thanh niên, Hội Sinh viên cấp ĐHCT trở lên khen thưởng thành tích xuất sắc phong trào TN-SV.',
          },
          {
            criteriaId: 5033,
            name: 'Trực tiếp tổ chức hoặc tham gia ít nhất 01 lớp tập huấn bồi dưỡng kỹ năng do Đoàn-Hội ĐHCT trở lên tổ chức.',
          },
          {
            criteriaId: 5034,
            name: 'Đạt điểm B trở lên học phần kỹ năng (Kỹ năng mềm, ĐMST & khởi nghiệp) và tham gia 01 hoạt động hội nhập ĐHCT.',
          },
          {
            criteriaId: 5035,
            name: 'Đạt giải Ba trở lên trong cuộc thi kiến thức hội nhập hoặc cuộc thi học thuật bằng ngoại ngữ cấp cơ sở/ĐHCT.',
          },
        ],
      },
    ],
  },
]

/**
 * Ensures a complete hierarchical tree for SV5T standards, populating all child criteria
 * and calculating requiredChildren, completedChildren, and completion statuses.
 */
export function ensureSv5tHierarchy(
  criteriaProgress?: StudentCriteriaProgressResponse,
  localCompletedMap?: Record<number, boolean>,
  localNoteMap?: Record<number, string>,
  transactions: any[] = []
): CriteriaProgressNode[] {
  // If server returns dynamic criteria tree, use it directly as primary source of truth
  if (criteriaProgress?.criteria && criteriaProgress.criteria.length > 0) {
    let sourceNodes = criteriaProgress.criteria
    // If backend returns the root node (level 0: Danh hiệu SV5T), unwrap its 5 child standards
    if (sourceNodes.length === 1 && sourceNodes[0].level === 0 && sourceNodes[0].children?.length) {
      sourceNodes = sourceNodes[0].children
    }

    function applyLocalUpdates(node: CriteriaProgressNode): CriteriaProgressNode {
      const updatedChildren = node.children ? node.children.map(applyLocalUpdates) : []
      let isCompleted = node.isCompleted
      let note = node.note

      const matchingTxs = transactions
        .filter((t) => Number(t.criteriaId) === node.criteriaId)
        .sort((a, b) => {
          const timeA = new Date(a.createdAt || 0).getTime() || a.id || 0
          const timeB = new Date(b.createdAt || 0).getTime() || b.id || 0
          return timeB - timeA
        })
      const systemTx = matchingTxs.find(
        (t) => t.completionSource === 'EVENT_CHECKOUT' || t.completionSource === 'SYSTEM' || Boolean(t.eventId)
      )
      const manualTx = matchingTxs.find((t) => t.completionSource === 'MANUAL')

      const isSystemRecorded = Boolean(systemTx)
      const isSelfEvaluated =
        Boolean(manualTx) ||
        Boolean(localCompletedMap?.[node.criteriaId]) ||
        (node.isCompleted && !isSystemRecorded)

      const completionSource = systemTx
        ? (systemTx.completionSource as any)
        : manualTx
          ? 'MANUAL'
          : node.completionSource ?? null

      if (localCompletedMap && Object.prototype.hasOwnProperty.call(localCompletedMap, node.criteriaId)) {
        isCompleted = Boolean(localCompletedMap[node.criteriaId])
        if (localNoteMap?.[node.criteriaId]) {
          note = localNoteMap[node.criteriaId]
        }
      } else if (updatedChildren.length > 0) {
        const doneCount = updatedChildren.filter((c) => c.isCompleted).length
        const req = node.requiredChildren ?? updatedChildren.length
        isCompleted = doneCount >= req
      }

      const completedChildren = updatedChildren.filter((c) => c.isCompleted).length

      return {
        ...node,
        isCompleted,
        note,
        completedChildren,
        totalChildren: updatedChildren.length,
        completionSource,
        isSystemRecorded,
        isSelfEvaluated,
        systemEventName: systemTx?.eventName || null,
        selfEvaluationNote: manualTx?.note || localNoteMap?.[node.criteriaId] || null,
        children: updatedChildren,
      }
    }

    return sourceNodes.map(applyLocalUpdates)
  }

  // Collect completed statuses from API response
  const completedMap = new Map<number, { completionSource?: string; completedAt?: string; note?: string; isSystemRecorded?: boolean; eventName?: string }>()

  // Overlay transactions data if available (sorted newest first)
  if (transactions && transactions.length > 0) {
    const sortedAll = [...transactions].sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime() || a.id || 0
      const timeB = new Date(b.createdAt || 0).getTime() || b.id || 0
      return timeB - timeA
    })
    sortedAll.forEach((t) => {
      const id = Number(t.criteriaId)
      if (!completedMap.has(id)) {
        const isSystem = t.completionSource === 'EVENT_CHECKOUT' || t.completionSource === 'SYSTEM' || Boolean(t.eventId)
        completedMap.set(id, {
          completionSource: t.completionSource,
          completedAt: t.createdAt,
          note: t.note,
          isSystemRecorded: isSystem,
          eventName: t.eventName,
        })
      }
    })
  }

  // Overlay API data if available
  if (criteriaProgress?.criteria) {
    function indexNodes(nodes: CriteriaProgressNode[]) {
      nodes.forEach((n) => {
        if (n.isCompleted) {
          completedMap.set(n.criteriaId, {
            completionSource: n.completionSource || 'MANUAL',
            completedAt: n.completedAt || undefined,
            note: n.note || undefined,
          })
        }
        if (n.children && n.children.length > 0) {
          indexNodes(n.children)
        }
      })
    }
    indexNodes(criteriaProgress.criteria)
  }

  // Overlay local optimistic changes
  if (localCompletedMap) {
    Object.entries(localCompletedMap).forEach(([idStr, done]) => {
      const id = Number(idStr)
      if (done) {
        const prev = completedMap.get(id) || {}
        const customNote = localNoteMap?.[id] && !isGenericText(localNoteMap[id]) ? localNoteMap[id] : undefined
        completedMap.set(id, {
          ...prev,
          completionSource: 'MANUAL',
          note: customNote || (!isGenericText(prev.note) ? prev.note : undefined) || SV5T_CRITERIA_GUIDES[id],
        })
      } else {
        completedMap.delete(id)
      }
    })
  }

  // Construct standards tree
  return CANONICAL_SV5T_STANDARDS.map((std, stdIdx) => {
    const directChildrenNodes: CriteriaProgressNode[] = std.children.map((child, chIdx) => {
      // Check if child has subChildren
      if (child.children && child.children.length > 0) {
        const subNodes: CriteriaProgressNode[] = child.children.map((sub, sIdx) => {
          const compInfo = completedMap.get(sub.criteriaId)
          const isCompleted = Boolean(compInfo)
          const customNote = compInfo?.note && !isGenericText(compInfo.note) ? compInfo.note : null
          const resolvedNote = customNote || sub.note || SV5T_CRITERIA_GUIDES[sub.criteriaId] || null
          return {
            criteriaId: sub.criteriaId,
            name: sub.name,
            note: resolvedNote,
            scope: 'UNIVERSITY',
            level: 3,
            childrenOrder: sIdx + 1,
            requiredChildren: null,
            isCompleted,
            completedChildren: isCompleted ? 1 : 0,
            totalChildren: 0,
            completionSource: (compInfo?.completionSource as any) || null,
            completedAt: compInfo?.completedAt || (isCompleted ? '2026-08-15T14:00:00Z' : null),
            isSystemRecorded: compInfo?.isSystemRecorded,
            isSelfEvaluated: isCompleted && !compInfo?.isSystemRecorded,
            systemEventName: compInfo?.eventName || null,
            selfEvaluationNote: customNote || null,
            children: [],
          }
        })

        const completedSub = subNodes.filter((s) => s.isCompleted).length
        const isGroupCompleted = completedSub >= 1

        return {
          criteriaId: child.criteriaId,
          name: child.name,
          note: child.note ?? SV5T_CRITERIA_GUIDES[child.criteriaId] ?? null,
          scope: 'UNIVERSITY',
          level: 2,
          childrenOrder: chIdx + 1,
          requiredChildren: 1,
          isCompleted: isGroupCompleted,
          completedChildren: completedSub,
          totalChildren: subNodes.length,
          completionSource: isGroupCompleted ? 'MANUAL' : null,
          completedAt: isGroupCompleted ? '2026-08-15T14:00:00Z' : null,
          children: subNodes,
        }
      }

      // Direct leaf
      const compInfo = completedMap.get(child.criteriaId)
      const isCompleted = Boolean(compInfo)
      const customNote = compInfo?.note && !isGenericText(compInfo.note) ? compInfo.note : null
      const resolvedNote = customNote || child.note || SV5T_CRITERIA_GUIDES[child.criteriaId] || null
      return {
        criteriaId: child.criteriaId,
        name: child.name,
        note: resolvedNote,
        scope: 'UNIVERSITY',
        level: 2,
        childrenOrder: chIdx + 1,
        requiredChildren: null,
        isCompleted,
        completedChildren: isCompleted ? 1 : 0,
        totalChildren: 0,
        completionSource: (compInfo?.completionSource as any) || null,
        completedAt: compInfo?.completedAt || (isCompleted ? '2026-08-15T14:00:00Z' : null),
        isSystemRecorded: compInfo?.isSystemRecorded,
        isSelfEvaluated: isCompleted && !compInfo?.isSystemRecorded,
        systemEventName: compInfo?.eventName || null,
        selfEvaluationNote: customNote || null,
        children: [],
      }
    })

    const completedDirect = directChildrenNodes.filter((c) => c.isCompleted).length
    const isStandardCompleted = completedDirect >= std.requiredChildren

    return {
      criteriaId: std.criteriaId,
      name: std.name,
      note: std.note ?? null,
      scope: 'UNIVERSITY',
      level: 1,
      childrenOrder: stdIdx + 1,
      requiredChildren: std.requiredChildren,
      isCompleted: isStandardCompleted,
      completedChildren: completedDirect,
      totalChildren: directChildrenNodes.length,
      completionSource: isStandardCompleted ? 'MANUAL' : null,
      completedAt: isStandardCompleted ? '2026-08-15T14:00:00Z' : null,
      children: directChildrenNodes,
    }
  })
}
