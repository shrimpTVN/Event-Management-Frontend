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
  it('supports legacy backend validation messages', () => {
    expect(
      eventApiErrors({
        response: { data: { message: '{name=must not be blank, dateClose=must not be null}' } },
      }).fields
    ).toEqual({ name: 'must not be blank', dateClose: 'must not be null' })
  })
})
