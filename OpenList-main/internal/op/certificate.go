package op

import (
	"github.com/OpenListTeam/OpenList/v4/internal/db"
	"github.com/OpenListTeam/OpenList/v4/internal/model"
)

// GetCertificates 获取所有证书
var GetCertificates = db.GetCertificates

// GetCertificatesByOwner 根据所有者获取证书
func GetCertificatesByOwner(owner string) ([]*model.Certificate, error) {
	var certificates []*model.Certificate
	err := db.GetDb().Where("owner = ?", owner).Find(&certificates).Error
	return certificates, err
}

// GetCertificatesByOwnerID 根据所有者ID获取证书
func GetCertificatesByOwnerID(ownerID uint) ([]*model.Certificate, error) {
	var certificates []*model.Certificate
	err := db.GetDb().Where("owner_id = ?", ownerID).Find(&certificates).Error
	return certificates, err
}

// GetCertificateByID 根据ID获取证书
var GetCertificateByID = db.GetCertificateByID

// CreateCertificate 创建证书
var CreateCertificate = db.CreateCertificate

// UpdateCertificate 更新证书
var UpdateCertificate = db.UpdateCertificate

// DeleteCertificate 删除证书
var DeleteCertificate = db.DeleteCertificate

// GetCertificateRequests 获取所有证书申请
var GetCertificateRequests = db.GetCertificateRequests

// GetCertificateRequestByID 根据ID获取证书申请
var GetCertificateRequestByID = db.GetCertificateRequestByID

// GetCertificateRequestsByUserID 根据用户ID获取证书申请
func GetCertificateRequestsByUserID(userID uint) ([]*model.CertificateRequest, error) {
	var requests []*model.CertificateRequest
	err := db.GetDb().Where("user_id = ?", userID).Find(&requests).Error
	return requests, err
}

// CreateCertificateRequest 创建证书申请
var CreateCertificateRequest = db.CreateCertificateRequest

// UpdateCertificateRequest 更新证书申请
var UpdateCertificateRequest = db.UpdateCertificateRequest

// DeleteCertificateRequest 删除证书申请
var DeleteCertificateRequest = db.DeleteCertificateRequest
