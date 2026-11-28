import { describe, expect, it } from 'vitest'
import { validateEventForm, eventApiErrors, type EventFormValues } from '../eventFormValidation'
const values: EventFormValues = {
  name: 'Sự kiện',
  description: 'Nội dung',
  location: 'Hội trường',
  semesterId: 1,
  eventTypeId: 1,
  capacity: 100,
  maleQuantity: '',
  femaleQuantity: '',
  dateHappen: '2030-01-03',
  timeStart: '08:00',
  timeEnd: '11:30',
  dateOpen: '2030-01-01',
  timeOpen: '08:00',
  dateClose: '2030-01-02',
  timeClose: '08:00',
  hasBanner: true,
}
describe('event form dates and inline API errors', () => {
  it('accepts overnight registration, including a midnight boundary', () => {
    expect(
      validateEventForm(
        {
          ...values,
          dateOpen: '2030-01-01',
          timeOpen: '23:59',
          dateClose: '2030-01-02',
          timeClose: '00:00',
        },
        [1],
        [1]
      )
    ).toEqual({})
  })
  it('rejects equal registration times while permitting closing at event start', () => {
    expect(
      validateEventForm(
        { ...values, dateClose: values.dateOpen, timeClose: values.timeOpen },
        [1],
        [1]
      ).dateClose
    ).toMatch(/phải sau/)
    expect(
      validateEventForm(
        { ...values, dateClose: values.dateHappen, timeClose: values.timeStart },
        [1],
        [1]
      )
    ).toEqual({})
  })
  it('rejects invalid dates and ending before starting at the matching fields', () => {
    expect(
      validateEventForm({ ...values, dateHappen: '2030-02-30' }, [1], [1]).dateHappen
    ).toBeTruthy()
    expect(validateEventForm({ ...values, timeEnd: '07:00' }, [1], [1]).timeEnd).toMatch(
      /sau giờ bắt đầu/
    )
  })
  it('maps API end-time and nested reward errors to their corresponding controls', () => {
    expect(
      eventApiErrors({
        response: {
          data: { data: { dateEnd: 'Không hợp lệ', 'eventPoints[0].point': 'Vượt điểm tối đa' } },
        },
      }).fields
    ).toEqual({ timeEnd: 'Không hợp lệ', eventPoints: 'Vượt điểm tối đa' })
  })
  it('translates legacy backend validation messages instead of exposing raw English', () => {
    expect(
      eventApiErrors({
        response: { data: { message: '{name=must not be blank, dateClose=must not be null}' } },
      }).fields
    ).toEqual({
      name: 'Trường này không được để trống.',
      dateClose: 'Trường này không được để trống.',
    })
  })
  it('translates English BE field errors and avoids duplicating dateClose when dateOpen is specified', () => {
    const result = eventApiErrors({
      response: {
        status: 400,
        data: {
          exceptionCode: '101',
          message: 'Registration open date must be before or equal to registration close date',
          data: {
            dateOpen: 'Registration open date must be before or equal to registration close date',
            maleQuantity: 'Total male and female quantities (70) cannot exceed event capacity (60)',
          },
        },
      },
    })
    expect(result.fields).toEqual({
      dateOpen: 'Thời gian mở đăng ký phải trước hoặc bằng thời gian đóng đăng ký.',
      maleQuantity: 'Tổng chỉ tiêu nam và nữ (70) không được vượt quá số lượng tham gia (60).',
    })
    expect(result.fields.dateClose).toBeUndefined()
  })
  it('never leaks raw AxiosError or unhandled English messages into summary banner', () => {
    const axios400 = eventApiErrors({
      message: 'Request failed with status code 400',
      response: {
        status: 400,
        data: {
          exceptionCode: '101',
          message: 'A completed event cannot be updated.',
          data: null,
        },
      },
    })
    expect(axios400.message).toBe('Sự kiện đã kết thúc nên không thể chỉnh sửa.')

    const networkErr = eventApiErrors({
      code: 'ERR_NETWORK',
      message: 'Network Error',
    })
    expect(networkErr.message).toBe('Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng và thử lại.')

    const unknownEnglish = eventApiErrors({
      message: 'Request failed with status code 500',
      response: {
        status: 500,
        data: { message: 'Unexpected internal error XYZ' },
      },
    })
    expect(unknownEnglish.message).toBe('Máy chủ đang gặp sự cố. Vui lòng thử lại sau.')
  })
})
