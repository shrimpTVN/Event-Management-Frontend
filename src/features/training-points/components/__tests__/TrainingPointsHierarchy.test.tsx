import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TrainingPointsSectionAccordion } from '../TrainingPointsSectionAccordion'
import { TrainingPointsTable } from '../TrainingPointsTable'
import type { StudentSemesterPointGroupedTree } from '../../types/trainingPoints.types'

afterEach(cleanup)

describe('TrainingPoints isMaxChild rendering', () => {
  it('renders backend totals and max-child selection without recomputing', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const sectionIII: StudentSemesterPointGroupedTree = {
      id: 3,
      name: 'III. Trách nhiệm tham gia các hoạt động CT-XH',
      note: 'Mã tiêu chí: III',
      maximum: 20,
      level: 0,
      parentCategoryId: null,
      isActive: true,
      childrenOrder: 3,
      isMaxChild: false,
      totalPoint: 19,
      systemPointRecord: 3,
      manualPointRecord: 16,
      items: [
        {
          id: 30,
          name: 'a. Hoạt động rèn luyện CT-XH',
          note: null,
          maximum: 12,
          level: 1,
          parentCategoryId: 3,
          isActive: true,
          childrenOrder: 1,
          isLeaf: false,
          totalPoint: 8,
          systemPointRecord: 0,
          manualPointRecord: 8,
        },
        {
          id: 301,
          name: 'Tham gia đầy đủ các hoạt động',
          note: null,
          maximum: 12,
          level: 2,
          parentCategoryId: 30,
          isActive: true,
          childrenOrder: 1,
          isLeaf: true,
          totalPoint: 8,
          systemPointRecord: 0,
          manualPointRecord: 8,
        },
        {
          id: 31,
          name: 'b. Công ích, tình nguyện',
          note: null,
          maximum: 10,
          level: 1,
          parentCategoryId: 3,
          isActive: true,
          childrenOrder: 2,
          isLeaf: false,
          totalPoint: 8,
          systemPointRecord: 0,
          manualPointRecord: 8,
        },
        {
          id: 311,
          name: 'Là lực lượng nòng cốt trong các phong trào',
          note: 'Mã tiêu chí: III.b.1',
          maximum: 5,
          level: 2,
          parentCategoryId: 31,
          isActive: true,
          childrenOrder: 1,
          isLeaf: false,
          isMaxChild: true,
          totalPoint: 8,
          systemPointRecord: 0,
          manualPointRecord: 8,
        },
        {
          id: 3111,
          contributesToParent: false,
          name: 'Cấp Bộ môn/Khoa, Chi đoàn, Chi hội',
          note: null,
          maximum: 3,
          level: 3,
          parentCategoryId: 311,
          isActive: true,
          childrenOrder: 1,
          isLeaf: true,
          totalPoint: 3,
          systemPointRecord: 0,
          manualPointRecord: 3,
        },
        {
          id: 3112,
          contributesToParent: true,
          name: 'Cấp ĐHCT; Đơn vị đào tạo và tương đương',
          note: null,
          maximum: 5,
          level: 3,
          parentCategoryId: 311,
          isActive: true,
          childrenOrder: 2,
          isLeaf: true,
          totalPoint: 5,
          systemPointRecord: 0,
          manualPointRecord: 5,
        },
        {
          id: 32,
          name: 'c. Tuyên truyền phòng chống tội phạm',
          note: null,
          maximum: 6,
          level: 1,
          parentCategoryId: 3,
          isActive: true,
          childrenOrder: 3,
          isLeaf: false,
          totalPoint: 3,
          systemPointRecord: 3,
          manualPointRecord: 0,
        },
        {
          id: 321,
          name: 'Tham gia hoạt động tuyên truyền',
          note: null,
          maximum: 6,
          level: 2,
          parentCategoryId: 32,
          isActive: true,
          childrenOrder: 1,
          isLeaf: true,
          totalPoint: 3,
          systemPointRecord: 3,
          manualPointRecord: 0,
        },
      ],
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TrainingPointsSectionAccordion
          section={sectionIII}
          sectionRoman="III"
          studentScores={{}}
          onSaveSelfScore={vi.fn()}
          defaultExpanded
        />
      </QueryClientProvider>
    )

    expect(screen.getByText('19/20 điểm')).toBeInTheDocument()
    expect(screen.queryByText('Lấy max mục con')).not.toBeInTheDocument()
    expect(screen.queryByText('Mã tiêu chí: III.b.1')).not.toBeInTheDocument()
    const infoTrigger = screen.getByLabelText('Giải thích cách tính điểm mục con')
    fireEvent.click(infoTrigger)
    expect(
      screen.getByText('Mục này lấy điểm cao nhất trong các tiêu chí con (không cộng dồn)')
    ).toBeInTheDocument()

    // Hàng III.b.1 là hàng cha có isMaxChild=true -> hiển thị điểm gộp 5 và không có nút sửa trực tiếp
    const row311 = screen.getByText('III.b.1').closest('.student-score-row') as HTMLElement
    expect(row311).toBeTruthy()
    expect(row311).toHaveTextContent('5')
    expect(row311.querySelectorAll('button')).toHaveLength(0)

    // Hàng con không thắng (III.b.1.1 = 3) được đánh dấu không cộng dồn
    const row3111 = screen.getByText('III.b.1.1').closest('.student-score-row') as HTMLElement
    expect(
      row3111.querySelector('[title="Không cộng dồn vì mục cha đang lấy mức điểm cao nhất"]')
    ).toBeTruthy()

    // Dòng Cộng điểm mục III -> Dữ liệu ghi nhận = 3, SV đánh giá = 13, Tổng = 16
    const footer = screen.getByText('Cộng điểm mục III').parentElement!
    expect(footer.children[1]).toHaveTextContent(/20$/)
    expect(footer.children[2]).toHaveTextContent(/3$/)
    expect(footer.children[3]).toHaveTextContent(/16$/)
    expect(footer.children[4]).toHaveTextContent(/19$/)
  })

  it('shows raw source points on leaves and capped source points on parents', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const section: StudentSemesterPointGroupedTree = {
      id: 1,
      name: 'Mục I',
      note: null,
      maximum: 20,
      level: 0,
      parentCategoryId: null,
      isActive: true,
      childrenOrder: 1,
      totalPoint: 16,
      systemPointRecord: 16,
      manualPointRecord: 16,
      items: [
        {
          id: 2,
          name: 'Nhóm hệ thống',
          note: null,
          maximum: 8,
          level: 1,
          parentCategoryId: 1,
          isActive: true,
          childrenOrder: 1,
          isLeaf: false,
          totalPoint: 8,
          systemPointRecord: 16,
          manualPointRecord: 0,
        },
        {
          id: 3,
          name: 'Lá hệ thống',
          note: null,
          maximum: 8,
          level: 2,
          parentCategoryId: 2,
          isActive: true,
          childrenOrder: 1,
          isLeaf: true,
          totalPoint: 16,
          systemPointRecord: 16,
          manualPointRecord: 0,
        },
        {
          id: 4,
          name: 'Nhóm tự đánh giá',
          note: null,
          maximum: 8,
          level: 1,
          parentCategoryId: 1,
          isActive: true,
          childrenOrder: 2,
          isLeaf: false,
          totalPoint: 8,
          systemPointRecord: 0,
          manualPointRecord: 16,
        },
        {
          id: 5,
          name: 'Lá tự đánh giá',
          note: null,
          maximum: 8,
          level: 2,
          parentCategoryId: 4,
          isActive: true,
          childrenOrder: 1,
          isLeaf: true,
          totalPoint: 16,
          systemPointRecord: 0,
          manualPointRecord: 16,
        },
      ],
    }
    render(
      <QueryClientProvider client={queryClient}>
        <TrainingPointsSectionAccordion
          section={section}
          sectionRoman="I"
          onSaveSelfScore={vi.fn()}
          defaultExpanded
        />
      </QueryClientProvider>
    )
    const row = (code: string) =>
      screen.getByText(code).closest('.student-score-row') as HTMLElement
    expect(row('I.a').children[3]).toHaveTextContent('8')
    expect(row('I.a.1').children[3]).toHaveTextContent('16')
    expect(row('I.b').children[4]).toHaveTextContent('8')
    expect(row('I.b.1').children[4]).toHaveTextContent('16')
    expect(row('I.a.1').children[5]).toHaveTextContent('8')
    expect(row('I.b.1').children[5]).toHaveTextContent('8')
    const footer = screen.getByText('Cộng điểm mục I').parentElement!
    expect(footer.children[2]).toHaveTextContent('16')
    expect(footer.children[3]).toHaveTextContent('16')
    expect(footer.children[4]).toHaveTextContent('16')
  })

  it('hides duplicate notes matching title while keeping rule notes in TrainingPointsTable', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const sections: StudentSemesterPointGroupedTree[] = [
      {
        id: 1,
        name: 'I. Học tập',
        note: null,
        maximum: 20,
        level: 0,
        parentCategoryId: null,
        isActive: true,
        childrenOrder: 1,
        totalPoint: 0,
        systemPointRecord: 0,
        manualPointRecord: 0,
        items: [
          {
            id: 101,
            name: 'Đi học đầy đủ',
            note: 'Đi học đầy đủ',
            maximum: 6,
            level: 2,
            parentCategoryId: 1,
            isActive: true,
            childrenOrder: 1,
            isLeaf: true,
            totalPoint: 0,
            systemPointRecord: 0,
            manualPointRecord: 0,
          },
        ],
      },
      {
        id: 2,
        name: 'II. Nội quy',
        note: null,
        maximum: 25,
        level: 0,
        parentCategoryId: null,
        isActive: true,
        childrenOrder: 2,
        totalPoint: 15,
        systemPointRecord: 15,
        manualPointRecord: 0,
        items: [
          {
            id: 201,
            name: 'Không vi phạm nội quy',
            note: 'Mỗi lần vi phạm trừ 03 điểm',
            maximum: 15,
            level: 2,
            parentCategoryId: 2,
            isActive: true,
            childrenOrder: 1,
            isLeaf: true,
            totalPoint: 15,
            systemPointRecord: 15,
            manualPointRecord: 0,
          },
        ],
      },
    ]

    render(
      <QueryClientProvider client={queryClient}>
        <TrainingPointsTable sections={sections} studentScores={{}} onSaveSelfScore={vi.fn()} />
      </QueryClientProvider>
    )

    expect(screen.queryByRole('button', { name: 'Chỉ hiện mục có điểm' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mở tất cả' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /I\. Học tập/i }))
    fireEvent.click(screen.getByRole('button', { name: /II\. Nội quy/i }))

    expect(screen.getAllByText('Đi học đầy đủ')).toHaveLength(1)
    expect(screen.getByText('Mỗi lần vi phạm trừ 03 điểm')).toBeInTheDocument()
  })
})
