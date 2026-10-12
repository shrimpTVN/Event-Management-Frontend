import { apiClient } from '@/shared'
import type { Certificate } from '../types/certificate.types'

export const certificateService = {
  /**
   * Retrieves certificate details by registration ID
   */
  async getCertificate(registrationId: string): Promise<Certificate> {
    return apiClient.get(`/certificates/${registrationId}`)
  },

  /**
   * Downloads certificate PDF
   */
  async downloadCertificatePdf(certificateId: string): Promise<Blob> {
    return apiClient.get(`/certificates/${certificateId}/download`, {
      responseType: 'blob',
    })
  },
}
