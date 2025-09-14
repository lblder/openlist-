import { r } from "."
import { PResp } from "~/types"

// 证书类型定义
export interface Certificate {
  id: number
  name: string
  type: "user" | "node"
  status: "pending" | "valid" | "expiring" | "revoked" | "rejected"
  owner: string
  owner_id?: number
  content?: string
  issued_date: string
  expiration_date: string
  created_at: string
  updated_at: string
}

export interface CertificateRequest {
  id: number
  user_name: string
  user_id?: number
  type: "user" | "node"
  status: "pending" | "valid" | "expiring" | "revoked" | "rejected"
  reason: string
  approved_by?: string
  approved_at?: string
  rejected_by?: string
  rejected_at?: string
  rejected_reason?: string
  created_at: string
  updated_at: string
}

// 获取所有证书
export const getCertificates = (): Promise<PResp<Certificate[]>> => {
  return r.get("/manage/certificate/list")
}

// 获取证书申请列表
export const getCertificateRequests = (): Promise<PResp<CertificateRequest[]>> => {
  return r.get("/manage/certificate/requests")
}

// 创建证书申请
export const createCertificateRequest = (
  data: Pick<CertificateRequest, "user_name" | "type" | "reason">
): Promise<PResp<CertificateRequest>> => {
  return r.post("/manage/certificate/request/create", data)
}

// 批准证书申请
export const approveCertificateRequest = (
  id: number,
  data: { approved_by: string }
): Promise<PResp<any>> => {
  return r.post(`/manage/certificate/request/approve/${id}`, data)
}

// 拒绝证书申请
export const rejectCertificateRequest = (
  id: number,
  data: { rejected_by: string; rejected_reason?: string }
): Promise<PResp<any>> => {
  return r.post(`/manage/certificate/request/reject/${id}`, data)
}

// 下载证书
export const downloadCertificate = (id: number): Promise<Blob> => {
  return r.get(`/manage/certificate/download/${id}`, {
    responseType: "blob"
  })
}

// 租户端获取证书列表
export const getTenantCertificates = (): Promise<PResp<Certificate[]>> => {
  return r.get("/manage/tenant/certificates")
}

// 租户端获取自己的证书申请列表
export const getTenantCertificateRequests = (): Promise<PResp<CertificateRequest[]>> => {
  return r.get("/manage/tenant/certificate/requests")
}

// 租户端创建证书申请
export const createTenantCertificateRequest = (
  data: Pick<CertificateRequest, "type" | "reason">
): Promise<PResp<CertificateRequest>> => {
  return r.post("/manage/tenant/certificate/request", data)
}

// 创建证书
export const createCertificate = (
  data: Pick<Certificate, "name" | "type" | "owner" | "issued_date" | "expiration_date"> & { content?: string, owner_id?: number }
): Promise<PResp<Certificate>> => {
  return r.post("/manage/certificate/create", data)
}

// 更新证书
export const updateCertificate = (
  id: number,
  data: Partial<Certificate>
): Promise<PResp<Certificate>> => {
  return r.put(`/manage/certificate/update/${id}`, data)
}

// 删除证书
export const deleteCertificate = (id: number): Promise<PResp<any>> => {
  return r.delete(`/manage/certificate/delete/${id}`)
}