// Package model 定义了证书相关的数据模型
//
// 该包包含证书(Certificate)和证书申请(CertificateRequest)两个核心模型，
// 以及相关的类型定义。
package model

import (
	"time"
	"gorm.io/gorm"
)

// CertificateType 证书类型
type CertificateType string

const (
	CertificateTypeUser CertificateType = "user"   // 用户证书
	CertificateTypeNode CertificateType = "node"   // 节点证书
)

// CertificateStatus 证书状态
type CertificateStatus string

const (
	CertificateStatusPending  CertificateStatus = "pending"   // 待审批
	CertificateStatusValid    CertificateStatus = "valid"     // 有效
	CertificateStatusExpiring CertificateStatus = "expiring"  // 即将过期
	CertificateStatusRevoked  CertificateStatus = "revoked"   // 已吊销
	CertificateStatusRejected CertificateStatus = "rejected"  // 已拒绝
)

// Certificate 证书实体
type Certificate struct {
	ID          uint              `gorm:"primaryKey" json:"id"`
	Name        string            `gorm:"not null;index" json:"name"`                  // 证书名称
	Type        CertificateType   `gorm:"not null;index" json:"type"`                  // 证书类型
	Status      CertificateStatus `gorm:"not null;index" json:"status"`                // 证书状态
	Owner       string            `gorm:"not null;index" json:"owner"`                 // 证书所有者(用户名)
	OwnerID     uint              `gorm:"index" json:"owner_id"`                       // 证书所有者ID
	Content     string            `gorm:"type:text" json:"content"`                    // 证书内容
	IssuedDate  time.Time         `json:"issued_date"`                                 // 颁发日期
	ExpirationDate time.Time      `json:"expiration_date"`                             // 过期日期
	CreatedAt   time.Time         `json:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at"`
	DeletedAt   gorm.DeletedAt    `gorm:"index" json:"deleted_at,omitempty"`
}

// CertificateRequest 证书申请实体
type CertificateRequest struct {
	ID          uint              `gorm:"primaryKey" json:"id"`
	UserName    string            `gorm:"not null;index" json:"user_name"`             // 申请人用户名
	UserID      uint              `gorm:"index" json:"user_id"`                        // 申请人用户ID
	Type        CertificateType   `gorm:"not null" json:"type"`                        // 申请证书类型
	Status      CertificateStatus `gorm:"not null;index" json:"status"`                // 申请状态
	Reason      string            `gorm:"type:text" json:"reason"`                     // 申请理由
	ApprovedBy  string            `json:"approved_by"`                                 // 审批人
	ApprovedAt  *time.Time        `json:"approved_at"`                                 // 审批时间
	RejectedBy  string            `json:"rejected_by"`                                 // 拒绝人
	RejectedAt  *time.Time        `json:"rejected_at"`                                 // 拒绝时间
	RejectedReason string         `json:"rejected_reason"`                             // 拒绝理由
	CreatedAt   time.Time         `json:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at"`
	DeletedAt   gorm.DeletedAt    `gorm:"index" json:"deleted_at,omitempty"`
}