package op

import (
	"github.com/OpenListTeam/OpenList/v4/internal/db"
	"github.com/OpenListTeam/OpenList/v4/internal/model"
)

// GetCertificates 获取所有证书
func GetCertificates() ([]*model.Certificate, error) {
	return db.GetCertificates()
}

// GetCertificateByID 根据ID获取证书
func GetCertificateByID(id uint) (*model.Certificate, error) {
	return db.GetCertificateByID(id)
}

// CreateCertificate 创建证书
func CreateCertificate(certificate *model.Certificate) error {
	return db.CreateCertificate(certificate)
}

// UpdateCertificate 更新证书
func UpdateCertificate(certificate *model.Certificate) error {
	return db.UpdateCertificate(certificate)
}

// DeleteCertificate 删除证书
func DeleteCertificate(id uint) error {
	return db.DeleteCertificate(id)
}

// GetCertificateRequests 获取所有证书申请
func GetCertificateRequests() ([]*model.CertificateRequest, error) {
	return db.GetCertificateRequests()
}

// GetCertificateRequestByID 根据ID获取证书申请
func GetCertificateRequestByID(id uint) (*model.CertificateRequest, error) {
	return db.GetCertificateRequestByID(id)
}

// CreateCertificateRequest 创建证书申请
func CreateCertificateRequest(request *model.CertificateRequest) error {
	return db.CreateCertificateRequest(request)
}

// UpdateCertificateRequest 更新证书申请
func UpdateCertificateRequest(request *model.CertificateRequest) error {
	return db.UpdateCertificateRequest(request)
}

// DeleteCertificateRequest 删除证书申请
func DeleteCertificateRequest(id uint) error {
	return db.DeleteCertificateRequest(id)
}