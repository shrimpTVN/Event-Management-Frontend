import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { useEventBenefitLines } from '../useEventBenefitLines'

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  client.setQueryData(
    ['pointCategories'],
    [
      ...[1, 2, 3, 4].map((id) => ({ id, name: `Mục ${id}`, childrenOrder: id })),
      {
        id: 50,
        name: 'Mục V',
        childrenOrder: 5,
        children: [
          { id: 51, name: 'Mục a', childrenOrder: 1 },
          {
            id: 52,
            name: 'Tham gia công tác xã hội',
            childrenOrder: 2,
            children: [{ id: 521, name: 'Tham gia hoạt động tình nguyện', childrenOrder: 1 }],
          },
        ],
      },
    ]
  )
  client.setQueryData(
    ['sv5tCriterias'],
    [
      {
        id: 40,
        name: 'Tiêu chuẩn Tình nguyện tốt',
        childrenOrder: 4,
        children: [{ id: 403, name: 'Tham gia ít nhất 02 lần hiến máu', childrenOrder: 3 }],
      },
    ]
  )
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('event benefit tooltip content', () => {
  it('restores the visible category code when the reward string only includes the point total', () => {
    const { result } = renderHook(
      () =>
        useEventBenefitLines('Cộng 02 điểm rèn luyện', undefined, undefined, [
          { pointCategoryId: 521 },
        ]),
      { wrapper }
    )
    expect(result.current[0]).toEqual({
      label: 'Cộng 02 điểm rèn luyện mục V.b',
      title: 'Tham gia hoạt động tình nguyện',
    })
  })
  it('replaces an outdated hardcoded category code with the actual hierarchy code', () => {
    const { result } = renderHook(
      () =>
        useEventBenefitLines('Cộng 02 điểm rèn luyện mục I.a', undefined, undefined, [
          { pointCategoryId: 521 },
        ]),
      { wrapper }
    )
    expect(result.current[0].label).toBe('Cộng 02 điểm rèn luyện mục V.b')
  })
  it('shows each awarded category once when an event awards points in multiple children', () => {
    const { result } = renderHook(
      () =>
        useEventBenefitLines('Cộng 05 điểm rèn luyện', undefined, undefined, [
          { pointCategoryId: 51 },
          { pointCategoryId: 52 },
          { pointCategoryId: 521 },
        ]),
      { wrapper }
    )
    expect(result.current[0].label).toBe('Cộng 05 điểm rèn luyện mục V.a, V.b')
  })
  it('shows the selected training point child name instead of repeating the displayed code', () => {
    const { result } = renderHook(
      () =>
        useEventBenefitLines('Cộng 02 điểm rèn luyện mục V.b', undefined, undefined, [
          { pointCategoryId: 521 },
        ]),
      { wrapper }
    )
    expect(result.current[0]).toEqual({
      label: 'Cộng 02 điểm rèn luyện mục V.b',
      title: 'Tham gia hoạt động tình nguyện',
    })
  })
  it('resolves a displayed code when older events omit point category IDs', () => {
    const { result } = renderHook(() => useEventBenefitLines('Cộng 02 điểm rèn luyện mục Vb'), {
      wrapper,
    })
    expect(result.current[0].title).toBe('Tham gia công tác xã hội')
  })
  it('uses Xét for SV5T while keeping only the child name in its tooltip', () => {
    const { result } = renderHook(
      () => useEventBenefitLines('Tiêu chuẩn SV5T: Tham gia ít nhất 02 lần hiến máu', 403),
      { wrapper }
    )
    expect(result.current[0]).toEqual({
      label: 'Xét Tình nguyện tốt (4.3)',
      title: 'Tham gia ít nhất 02 lần hiến máu',
    })
  })
})
