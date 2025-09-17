import { r } from "."
import { PResp } from "~/types"

// 证书数据类型
export interface Certificate {
  id: number
  name: string
  type: "user" | "node"
  status: "pending" | "valid" | "expiring" | "revoked" | "rejected"
  owner: string
  owner_id?: number
  content?: string
  expiration_date: string | Date
  issued_date: string | Date
  created_at: string
  updated_at: string
}

// 证书申请数据类型
export interface CertificateRequest {
  id: number
  user_name: string
  user_id?: number
  type: "user" | "node"
  status: "pending" | "valid" | "rejected"
  reason: string
  approved_by?: string
  approved_at?: string
  rejected_by?: string
  rejected_at?: string
  rejected_reason?: string
  created_at: string
  updated_at: string
}

// 管理员接口
export const getCertificates = (page = 1, per_page = 10): Promise<PResp<Certificate[]>> => {
  return r.get("/admin/certificate/list", {
    params: { page, per_page } as { page: number; per_page: number }
  })
}

export const getCertificateRequests = (page = 1, per_page = 10): Promise<PResp<CertificateRequest[]>> => {
  return r.get("/admin/certificate/requests", {
    params: { page, per_page } as { page: number; per_page: number }
  })
}

export const createCertificate = (data: Partial<Certificate>): Promise<PResp<Certificate>> => {
  return r.post("/admin/certificate/create", data)
}

export const createCertificateRequest = (data: Partial<CertificateRequest>): Promise<PResp<CertificateRequest>> => {
  return r.post("/admin/certificate/request", data)
}

export const updateCertificate = (id: number, data: Partial<Certificate>): Promise<PResp<Certificate>> => {
  return r.put(`/admin/certificate/update/${id}`, data)
}

export const deleteCertificate = (id: number): Promise<PResp<any>> => {
  return r.delete(`/admin/certificate/delete/${id}`)
}

export const revokeCertificate = (id: number): Promise<PResp<any>> => {
  return r.post(`/admin/certificate/revoke/${id}`)
}

export const approveCertificateRequest = (id: number, data: { approved_by: string }): Promise<PResp<Certificate>> => {
  return r.post(`/admin/certificate/request/approve/${id}`, data)
}

export const rejectCertificateRequest = (id: number, data: { rejected_by: string; rejected_reason?: string }): Promise<PResp<CertificateRequest>> => {
  return r.post(`/admin/certificate/request/reject/${id}`, data)
}

export const downloadCertificate = (id: number): Promise<Blob> => {
  return r.get(`/admin/certificate/download/${id}`, {
    responseType: 'blob' as 'blob'
  })
}

// 租户接口
export const getTenantCertificates = (): Promise<PResp<Certificate[]>> => {
  return r.get("/tenant/certificates")
}

export const getTenantCertificate = (): Promise<PResp<Certificate | null>> => {
  return r.get("/tenant/certificate")
}

export const getTenantCertificateRequests = (): Promise<PResp<CertificateRequest[]>> => {
  return r.get("/tenant/certificate/requests")
}

export const createTenantCertificateRequest = (data: Pick<CertificateRequest, "type" | "reason">): Promise<PResp<CertificateRequest>> => {
  return r.post("/tenant/certificate/request", data)
}

export const downloadTenantCertificate = (): Promise<Blob> => {
  return r.get("/tenant/certificate/download", {
    responseType: 'blob' as 'blob'
  })
}
