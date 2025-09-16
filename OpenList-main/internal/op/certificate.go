package op

import (
"fmt"
"time"

"github.com/OpenListTeam/OpenList/v4/internal/db"
"github.com/OpenListTeam/OpenList/v4/internal/errs"
"github.com/OpenListTeam/OpenList/v4/internal/model"
"github.com/pkg/errors"
"gorm.io/gorm"
)

// --- Certificate Service ---

var GetCertificateByID = db.GetCertificateByID
var GetCertificates = db.GetCertificates
var CreateCertificate = db.CreateCertificate

// GetCertificateForTenant 是租户端调用的核心服务
func GetCertificateForTenant(ownerID uint) (*model.Certificate, error) {
cert, err := db.GetCertificateByOwnerID(ownerID)
if err != nil {
// 如果错误不是 "记录未找到"，则是一个真正的数据库错误
if !errors.Is(err, gorm.ErrRecordNotFound) {
return nil, err
}
// 如果是 "记录未找到"，是正常情况，说明租户没有证书
return nil, nil
}
return cert, nil
}

func UpdateCertificateDetails(id uint, name string, expirationDate time.Time) (*model.Certificate, error) {
cert, err := db.GetCertificateByID(id)
if err != nil {
return nil, err
}
cert.Name = name
cert.ExpirationDate = expirationDate
err = db.UpdateCertificate(cert)
return cert, err
}

func RevokeCertificate(id uint) error {
cert, err := db.GetCertificateByID(id)
if err != nil {
return err
}
cert.Status = model.CertificateStatusRevoked
return db.UpdateCertificate(cert)
}

func DeleteCertificate(id uint) error {
return db.DeleteCertificate(id)
}

// --- CertificateRequest Service ---

var GetCertificateRequests = db.GetCertificateRequests
var GetCertificateRequestByID = db.GetCertificateRequestByID
var GetTenantCertificateRequests = db.GetCertificateRequestsByUserID
var CreateCertificateRequest = db.CreateCertificateRequest

// CreateTenantCertificateRequest 租户申请证书的业务逻辑
func CreateTenantCertificateRequest(user *model.User, reqType model.CertificateType, reason string) (*model.CertificateRequest, error) {
// 1. 检查租户是否已经有了一个有效的证书
existingCert, err := db.GetCertificateByOwnerID(user.ID)
if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
return nil, errors.Wrap(err, "failed to check existing certificate")
}
if existingCert != nil && (existingCert.Status == model.CertificateStatusValid || existingCert.Status == model.CertificateStatusExpiring) {
return nil, errs.CertificateAlreadyExists
}

// 2. 检查租户是否已经有一个正在处理的申请
_, err = db.GetPendingCertificateRequestByUserID(user.ID)
if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
return nil, errors.Wrap(err, "failed to check pending request")
}
if !errors.Is(err, gorm.ErrRecordNotFound) {
return nil, errs.CertificateRequestPending
}

// 3. 创建新的申请
request := &model.CertificateRequest{
UserName: user.Username,
UserID:   user.ID,
Type:     reqType,
Status:   model.CertificateStatusPending,
Reason:   reason,
}

if err := db.CreateCertificateRequest(request); err != nil {
return nil, err
}
return request, nil
}

// ApproveAndCreateCertificate 将批准和创建证书合并为一个事务性操作
func ApproveAndCreateCertificate(reqID uint, adminUser *model.User) (*model.Certificate, error) {
// 1. 获取申请记录
req, err := db.GetCertificateRequestByID(reqID)
if err != nil {
return nil, err
}
if req.Status != model.CertificateStatusPending {
return nil, errs.CertificateRequestNotPending
}

// 2. 更新申请状态
now := time.Now()
req.Status = model.CertificateStatusValid
req.ApprovedBy = adminUser.Username
req.ApprovedAt = &now
if err := db.UpdateCertificateRequest(req); err != nil {
return nil, err
}

// 3. 创建新证书
certName := fmt.Sprintf("%s-%s-%s", req.UserName, req.Type, now.Format("20060102"))
cert := &model.Certificate{
Name:           certName,
Type:           req.Type,
Status:         model.CertificateStatusValid,
Owner:          req.UserName,
OwnerID:        req.UserID,
IssuedDate:     now,
ExpirationDate: now.AddDate(1, 0, 0), // 默认有效期1年
Content:        fmt.Sprintf("-----BEGIN CERTIFICATE-----\n%s\n-----END CERTIFICATE-----", "This is a dummy certificate content."), // TODO: Replace with actual certificate generation logic
}

if err := db.CreateCertificate(cert); err != nil {
// 如果创建证书失败，最好能回滚申请状态的变更（需要事务支持）
return nil, err
}
return cert, nil
}

// RejectCertificateRequest 拒绝证书申请
func RejectCertificateRequest(reqID uint, adminUser *model.User, reason string) (*model.CertificateRequest, error) {
req, err := db.GetCertificateRequestByID(reqID)
if err != nil {
return nil, err
}
if req.Status != model.CertificateStatusPending {
return nil, errs.CertificateRequestNotPending
}

now := time.Now()
req.Status = model.CertificateStatusRejected
req.RejectedBy = adminUser.Username
req.RejectedAt = &now
req.RejectedReason = reason

err = db.UpdateCertificateRequest(req)
return req, err
}
