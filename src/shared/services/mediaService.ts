import { apiClient } from './api'

export interface PresignedResponse {
  uploadUrl: string
  apiKey: string
  timestamp: number
  signature: string
  folder: string
  assetFolder?: string
  publicId?: string
  cloudName: string
}

export type MediaCategory =
  | 'AVATAR'
  | 'FANPAGE'
  | 'EVENT'
  | 'EVIDENCE'
  | 'CERTIFICATE'
  | 'GENERAL'

export const mediaService = {
  /**
   * Requests presigned upload parameters from the backend for Cloudinary
   */
  getPresignedUpload: async (
    category: MediaCategory = 'EVENT',
    fileExtension?: string
  ): Promise<PresignedResponse> => {
    const res: any = await apiClient.post('/media/presign', {
      category,
      fileExtension: fileExtension ? fileExtension.replace(/^\./, '').toLowerCase() : undefined,
    })
    return res
  },

  /**
   * Uploads an image file to Cloudinary via backend-generated presigned signature
   * Returns the secure URL of the uploaded image
   */
  uploadImage: async (
    file: File,
    category: MediaCategory = 'EVENT'
  ): Promise<string> => {
    const ext = file.name.split('.').pop() || 'png'
    const presign = await mediaService.getPresignedUpload(category, ext)

    if (!presign || !presign.uploadUrl) {
      throw new Error('Không thể lấy thông tin xác thực tải ảnh lên từ máy chủ')
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('api_key', presign.apiKey)
    formData.append('timestamp', String(presign.timestamp))
    formData.append('signature', presign.signature)
    formData.append('folder', presign.folder)
    if (presign.assetFolder) {
      formData.append('asset_folder', presign.assetFolder)
    }
    if (presign.publicId) {
      formData.append('public_id', presign.publicId)
    }

    // Direct upload to Cloudinary (using native fetch without credentials/JWT)
    const response = await fetch(presign.uploadUrl, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errJson = await response.json().catch(() => null)
      const message = errJson?.error?.message || response.statusText
      throw new Error(`Tải ảnh lên Cloudinary thất bại: ${message}`)
    }

    const data = await response.json()
    return data.secure_url || data.url
  },
}

