import { describe, expect, it } from 'vitest'
import { createSv5tLabelFormatter } from '../sv5tLabels'

const childName = 'Tham gia ít nhất 02 lần hiến máu tình nguyện trong năm học'
const criteria = [
  {
    id: 1,
    name: 'Danh hiệu SV5T',
    children: [
      {
        id: 17,
        name: 'Tiêu chuẩn Tình nguyện tốt',
        childrenOrder: 4,
        children: [{ id: 20, name: childName, childrenOrder: 3 }],
      },
    ],
  },
]

describe('compact SV5T labels', () => {
  it('uses the actual hierarchy order rather than database IDs', () => {
    const format = createSv5tLabelFormatter(criteria, { compact: true })
    expect(format(childName, 20)).toBe('Tiêu chuẩn Tình nguyện tốt (4.3)')
    expect(format(childName)).toBe('Tiêu chuẩn Tình nguyện tốt (4.3)')
    expect(createSv5tLabelFormatter(criteria)(childName, 20)).toBe(
      `Tiêu chuẩn Tình nguyện tốt (${childName})`
    )
  })

  it('retains the full name when the server omits the criterion order', () => {
    const format = createSv5tLabelFormatter(
      [
        {
          id: 40,
          name: 'Tình nguyện tốt',
          childrenOrder: 4,
          children: [{ id: 403, name: childName }],
        },
      ],
      { compact: true }
    )
    expect(format(childName, 403)).toBe(`Tình nguyện tốt (${childName})`)
  })
})
