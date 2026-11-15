import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AttendancePhotoPicker } from '../AttendancePhotoPicker'

const stop = vi.fn()
const media = { getTracks: () => [{ stop }] } as unknown as MediaStream
const getUserMedia = vi.fn()
beforeEach(() => {
  vi.resetAllMocks()
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } })
  getUserMedia.mockResolvedValue(media)
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('attendance photo sources', () => {
  it('passes a chosen local photo without requesting the camera', () => {
    const onSelect = vi.fn()
    render(<AttendancePhotoPicker disabled={false} onSelect={onSelect} />)
    const file = new File(['photo'], 'local.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText('Tải ảnh minh chứng'), { target: { files: [file] } })
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(file)
    expect(getUserMedia).not.toHaveBeenCalled()
  })
  it('captures a JPEG from the camera and releases all tracks', async () => {
    const onSelect = vi.fn()
    const drawImage = vi.fn()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage } as any)
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) =>
      callback(new Blob(['photo'], { type: 'image/jpeg' }))
    )
    render(<AttendancePhotoPicker disabled={false} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: 'Mở camera' }))
    const video = await screen.findByLabelText('Camera điểm danh')
    Object.defineProperties(video, { videoWidth: { value: 1280 }, videoHeight: { value: 960 } })
    fireEvent.loadedData(video)
    fireEvent.click(screen.getByRole('button', { name: 'Chụp ảnh' }))
    expect(drawImage).toHaveBeenCalled()
    expect(onSelect.mock.calls[0][0]).toBeInstanceOf(File)
    expect(onSelect.mock.calls[0][0].type).toBe('image/jpeg')
    expect(stop).toHaveBeenCalledOnce()
    expect(screen.queryByLabelText('Camera điểm danh')).not.toBeInTheDocument()
  })
  it('keeps file upload available when camera permission is denied', async () => {
    getUserMedia.mockRejectedValue(new DOMException('Denied', 'NotAllowedError'))
    const onSelect = vi.fn()
    render(<AttendancePhotoPicker disabled={false} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: 'Mở camera' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('chưa cho phép')
    expect(screen.getByRole('button', { name: 'Chọn ảnh từ máy' })).toBeEnabled()
    expect(onSelect).not.toHaveBeenCalled()
  })
  it('stops a camera permission request resolving after the modal has closed', async () => {
    let resolve!: (stream: MediaStream) => void
    getUserMedia.mockReturnValue(
      new Promise<MediaStream>((done) => {
        resolve = done
      })
    )
    const view = render(<AttendancePhotoPicker disabled={false} onSelect={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Mở camera' }))
    view.unmount()
    await act(async () => resolve(media))
    await waitFor(() => expect(stop).toHaveBeenCalledOnce())
  })
})
