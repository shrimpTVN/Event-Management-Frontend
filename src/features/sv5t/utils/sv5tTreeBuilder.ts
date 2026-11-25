import type {
  CriteriaProgressNode,
  EvaluationScope,
  StudentCriteriaProgressResponse,
} from '../types/sv5t.types'

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

export interface CanonicalSv5tDefinition {
  criteriaId: number
  name: string
  note?: string | null
  requiredChildren?: number
  requiredOccurrences?: number
  children?: CanonicalSv5tDefinition[]
}

/**
 * Canonical CICT (Trường Công nghệ Thông tin và Truyền thông - ĐHCT) SV5T standards
 * based on QĐ số 09-QĐ/ĐTN (14/03/2026), nhiệm kỳ 2025-2027.
 */
export const CANONICAL_FACULTY_SV5T_STANDARDS: CanonicalSv5tDefinition[] = [
  {
    criteriaId: 6100,
    name: 'Tiêu chuẩn Đạo đức tốt',
    note: 'Đạt đủ 03 tiêu chuẩn: (1.1), (1.2) và (1.3)',
    requiredChildren: 3,
    children: [
      {
        criteriaId: 6101,
        name: 'Điểm rèn luyện trung bình cộng của HK3 năm học trước, HK1 và HK2 năm học xét đạt từ 85 điểm trở lên.',
        note: 'SV năm nhất chỉ xét điểm HK1 và HK2 năm học xét.',
      },
      {
        criteriaId: 6102,
        name: 'Không vi phạm pháp luật và các quy chế, nội quy của nhà trường, quy định của địa phương và cộng đồng.',
        note: null,
      },
      {
        criteriaId: 6103,
        name: 'Đạt thêm 01 trong các tiêu chí về tư tưởng, đạo đức, lối sống',
        note: 'Đạt thêm 01 tiêu chí bên dưới (QĐ 09-QĐ/ĐTN ghi mục 1.3.1 đến 1.3.4)',
        requiredChildren: 1,
        children: [
          {
            criteriaId: 61031,
            name: 'Tham gia cuộc thi tìm hiểu về các môn khoa học chính trị, tư tưởng Hồ Chí Minh do đơn vị Đoàn - Hội cấp cơ sở và tương đương trở lên tổ chức.',
          },
          {
            criteriaId: 61032,
            name: 'Tham gia các hoạt động giáo dục lòng yêu nước, tinh thần tự hào dân tộc (di tích lịch sử, bảo tàng, mẹ VNAH, thắp nến tri ân, ca khúc truyền thống, biên giới hải đảo...).',
          },
          {
            criteriaId: 61033,
            name: 'Tham gia hoạt động giáo dục đạo đức, lối sống văn hóa cho sinh viên.',
          },
          {
            criteriaId: 61034,
            name: 'Là thanh niên tiêu biểu trong học tập và làm theo lời Bác.',
          },
        ],
      },
    ],
  },
  {
    criteriaId: 6200,
    name: 'Tiêu chuẩn Học tập tốt',
    note: 'Đạt đủ 03 tiêu chí: ĐTB cộng >= 3.0, >= 12 tín chỉ/học kỳ và không nợ học phần.',
    requiredChildren: 3,
    children: [
      {
        criteriaId: 6201,
        name: 'Điểm trung bình cộng của HK3 năm học trước, HK1 và HK2 năm học xét đạt từ 3.0 trở lên.',
        note: 'SV năm nhất chỉ xét điểm của HK1 và HK2 trong năm học.',
      },
      {
        criteriaId: 6202,
        name: 'Số tín chỉ trong mỗi học kỳ bằng hoặc lớn hơn 12 tín chỉ.',
        note: 'Đối với những trường hợp đặc biệt, hội đồng xét sẽ ghi nhận và xem xét.',
      },
      {
        criteriaId: 6203,
        name: 'Không bị nợ học phần.',
        note: null,
      },
    ],
  },
  {
    criteriaId: 6300,
    name: 'Tiêu chuẩn Thể lực tốt',
    note: 'Đạt 01 trong 02 tiêu chuẩn: (3.1) hoặc (3.2)',
    requiredChildren: 1,
    children: [
      {
        criteriaId: 6301,
        name: 'Trong năm học học ít nhất 01 học phần Giáo dục thể chất (học phần có điểm rèn luyện thể lực) và đạt điểm B trở lên.',
        note: 'SV khuyết tật, bệnh mãn tính, tai nạn được miễn TH GDTC/GDQP&AN có xác nhận Nhà trường được miễn xét.',
      },
      {
        criteriaId: 6302,
        name: 'Tham gia ít nhất 01 hoạt động rèn luyện thể lực (thể dục, thể thao, dân vũ) do đơn vị Đoàn - Hội cấp cơ sở tổ chức.',
        note: 'SV khuyết tật, bệnh mãn tính, tai nạn được miễn TH GDTC/GDQP&AN có xác nhận Nhà trường được miễn xét.',
      },
    ],
  },
  {
    criteriaId: 6400,
    name: 'Tiêu chuẩn Tình nguyện tốt',
    note: 'Đạt 01 trong 03 tiêu chí: (4.1), (4.2) hoặc (4.3)',
    requiredChildren: 1,
    children: [
      {
        criteriaId: 6401,
        name: 'Được các cấp Đảng, Đoàn, Hội, chính quyền khen thưởng trong hoạt động tình nguyện.',
        note: null,
      },
      {
        criteriaId: 6402,
        name: 'Tham gia ít nhất 02 ngày tình nguyện.',
        requiredOccurrences: 2,
      },
      {
        criteriaId: 6403,
        name: 'Tham gia ít nhất 01 lần hiến máu tình nguyện.',
        requiredOccurrences: 1,
      },
    ],
  },
  {
    criteriaId: 6500,
    name: 'Tiêu chuẩn Hội nhập tốt',
    note: 'Đạt 02 trong 03 tiêu chuẩn: (5.1) Ngoại ngữ, (5.2) Tin học, (5.3) Kỹ năng hội nhập',
    requiredChildren: 2,
    children: [
      {
        criteriaId: 6501,
        name: '(5.1) Ngoại ngữ: Đạt 01 trong 04 tiêu chí sau',
        requiredChildren: 1,
        children: [
          {
            criteriaId: 65011,
            name: 'Được khen thưởng cuộc thi ngoại ngữ cấp Trường Công nghệ Thông tin và Truyền thông trở lên.',
          },
          {
            criteriaId: 65012,
            name: 'Đạt chứng chỉ ngoại ngữ theo bảng quy đổi chuẩn CEFR (IELTS, TOEIC, TOEFL, DELF, HSK, TOPIK, JLPT).',
            note: 'SV năm 1-2: A2/IELTS 4.0/TOEIC 400/DELF A2/HSK 2/TOPIK 2/JLPT N5; SV năm 3+: B1/IELTS 4.5/TOEIC 450/DELF B1/HSK 3/TOPIK 3/JLPT N4. Thi trong năm học xét; khác thời gian cần thêm 01 HP/khóa NN hoặc 01 HĐ hội nhập Đoàn-Hội cơ sở+.',
          },
          {
            criteriaId: 65013,
            name: 'Đối với sinh viên năm thứ hai: Đã hoàn thành hoặc được miễn 03 học phần Ngoại ngữ căn bản.',
            note: 'Mỗi sinh viên chỉ xét 01 lần đối với tiêu chuẩn (5.1.3) và (5.1.4).',
          },
          {
            criteriaId: 65014,
            name: 'Đối với sinh viên năm thứ nhất: Đã hoàn thành hoặc được miễn 02 học phần Ngoại ngữ căn bản trở lên.',
            note: 'Mỗi sinh viên chỉ xét 01 lần đối với tiêu chuẩn (5.1.3) và (5.1.4).',
          },
        ],
      },
      {
        criteriaId: 6502,
        name: '(5.2) Tin học: Đạt 01 trong 02 tiêu chí sau',
        requiredChildren: 1,
        children: [
          {
            criteriaId: 65021,
            name: 'Điểm trung bình cộng HK3 năm học trước, HK1 và HK2 năm học xét đạt từ 3.0 trở lên.',
          },
          {
            criteriaId: 65022,
            name: 'Được cấp giấy khen về các cuộc thi tin học do Trường Công nghệ Thông tin và Truyền thông trở lên tổ chức.',
          },
        ],
      },
      {
        criteriaId: 6503,
        name: '(5.3) Tham gia các hoạt động, phong trào nâng cao kỹ năng hội nhập: Đạt 01 trong 05 tiêu chí sau',
        requiredChildren: 1,
        children: [
          {
            criteriaId: 65031,
            name: 'Tham gia hoặc trực tiếp tổ chức 02 hoạt động hội nhập do các đơn vị trực thuộc Đoàn Trường CNTT&TT, đơn vị kết nghĩa, đối tác và tương đương trở lên tổ chức.',
            note: 'Giao lưu SV quốc tế, trao đổi SV, cuộc thi ngoại ngữ, tìm hiểu văn hóa, lịch sử, xã hội trong nước và thế giới...',
            requiredOccurrences: 2,
          },
          {
            criteriaId: 65032,
            name: 'Được Đoàn Thanh niên, Hội Sinh viên cấp Đại học Cần Thơ trở lên khen thưởng về thành tích xuất sắc trong phong trào TN-SV năm học.',
          },
          {
            criteriaId: 65033,
            name: 'Trực tiếp tổ chức hoặc tham gia ít nhất 01 lớp tập huấn hoặc khóa học bồi dưỡng kỹ năng do Đoàn Trường CNTT&TT trở lên tổ chức.',
            requiredOccurrences: 1,
          },
          {
            criteriaId: 65034,
            name: 'Đạt điểm B trở lên học phần về kỹ năng (Kỹ năng mềm, ĐMST & khởi nghiệp) do ĐHCT giảng dạy và tham gia 01 HĐ hội nhập cấp Trường CNTT&TT trở lên.',
          },
          {
            criteriaId: 65035,
            name: 'Đạt giải Ba trở lên cuộc thi kiến thức hội nhập hoặc học thuật bằng ngoại ngữ do Đoàn cơ sở hoặc HSV VN ĐHCT trở lên tổ chức.',
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
  transactions: any[] = [],
  scope: EvaluationScope = 'UNIVERSITY'
): CriteriaProgressNode[] {
  function buildCanonicalNode(
    definition: CanonicalSv5tDefinition,
    index: number,
    level: number,
    nodeScope: EvaluationScope
  ): CriteriaProgressNode {
    const children = (definition.children || []).map((child, childIndex) =>
      buildCanonicalNode(child, childIndex, level + 1, nodeScope)
    )
    return {
      criteriaId: definition.criteriaId,
      name: definition.name,
      note: definition.note ?? (nodeScope === 'UNIVERSITY' ? SV5T_CRITERIA_GUIDES[definition.criteriaId] : null) ?? null,
      scope: nodeScope,
      level,
      childrenOrder: index + 1,
      requiredChildren: children.length ? (definition.requiredChildren ?? 1) : null,
      requiredOccurrences: definition.requiredOccurrences ?? 1,
      isCompleted: false,
      completedChildren: 0,
      totalChildren: children.length,
      children,
    }
  }

  const canonicalFallback = () => {
    const defs =
      scope === 'FACULTY' ? CANONICAL_FACULTY_SV5T_STANDARDS : CANONICAL_SV5T_STANDARDS
    return defs.map((standard, index) => buildCanonicalNode(standard, index, 1, scope))
  }

  let sourceNodes: CriteriaProgressNode[] = []
  if (criteriaProgress?.criteria?.length) {
    const unwrapped = criteriaProgress.criteria.flatMap((node) =>
      node.level === 0 && node.children?.length ? node.children : [node]
    )
    const scoped = unwrapped.filter((node) => (node.scope || 'UNIVERSITY') === scope)
    sourceNodes = scoped.length > 0 ? scoped : canonicalFallback()
  } else {
    sourceNodes = canonicalFallback()
  }

  function applyProgress(node: CriteriaProgressNode): CriteriaProgressNode {
    const children = (node.children || []).map(applyProgress)
    const matchingTxs = transactions
      .filter((transaction) => Number(transaction.criteriaId) === node.criteriaId)
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime() ||
          Number(b.id || 0) - Number(a.id || 0)
      )
    const systemTxs = matchingTxs.filter(
      (transaction) =>
        transaction.completionSource === 'EVENT_CHECKOUT' ||
        transaction.completionSource === 'SYSTEM' ||
        Boolean(transaction.eventId)
    )
    const systemTx = systemTxs[0]
    const recordedOccurrences = Math.max(
      Number(node.recordedOccurrences || 0),
      new Set(systemTxs.map((t) => (t.eventId != null ? `event:${t.eventId}` : `system:${t.id}`)))
        .size
    )
    const manualTx = matchingTxs.find((transaction) => transaction.completionSource === 'MANUAL')
    const hasLocalEvaluation = Object.prototype.hasOwnProperty.call(
      localCompletedMap || {},
      node.criteriaId
    )
    // Only an explicit manual record or a student's own action can set self-evaluation.
    const isSelfEvaluated = hasLocalEvaluation
      ? Boolean(localCompletedMap?.[node.criteriaId])
      : Boolean(manualTx || node.isSelfEvaluated || node.completionSource === 'MANUAL')
    const isSystemRecorded = Boolean(
      systemTx ||
      node.isSystemRecorded ||
      node.completionSource === 'EVENT_CHECKOUT' ||
      node.completionSource === 'SYSTEM' ||
      recordedOccurrences > 0
    )
    const isSystemCompleted =
      (node.requiredOccurrences || 1) > 1
        ? recordedOccurrences >= (node.requiredOccurrences || 1)
        : isSystemRecorded
    const completedChildren = children.filter((child) => child.isCompleted).length
    const isCompleted = children.length
      ? completedChildren >= (node.requiredChildren ?? children.length)
      : (node.requiredOccurrences || 1) > 1
        ? isSystemCompleted
        : isSystemCompleted ||
          isSelfEvaluated ||
          (!hasLocalEvaluation && node.isCompleted && !node.completionSource)
    const manualNote = hasLocalEvaluation
      ? localNoteMap?.[node.criteriaId]
      : (manualTx?.note ?? node.selfEvaluationNote)

    return {
      ...node,
      children,
      isCompleted,
      completedChildren,
      totalChildren: children.length,
      completionSource: isSystemCompleted
        ? systemTx?.completionSource === 'SYSTEM' || node.completionSource === 'SYSTEM'
          ? 'SYSTEM'
          : 'EVENT_CHECKOUT'
        : isSelfEvaluated
          ? 'MANUAL'
          : null,
      recordedOccurrences,
      isSystemRecorded,
      isSelfEvaluated,
      systemEventName: systemTx?.eventName ?? node.systemEventName ?? null,
      selfEvaluationNote: isSelfEvaluated && !isGenericText(manualNote) ? manualNote : null,
    }
  }

  return sourceNodes.map(applyProgress)
}
