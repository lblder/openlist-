package db

import (
	log "github.com/sirupsen/logrus"

	"github.com/OpenListTeam/OpenList/v4/internal/conf"
	"github.com/OpenListTeam/OpenList/v4/internal/model"
	"gorm.io/gorm"
)

var db *gorm.DB

func Init(d *gorm.DB) {
	db = d
	err := AutoMigrate(
		new(model.Storage), 
		new(model.User), 
		new(model.Meta), 
		new(model.SettingItem), 
		new(model.SearchNode), 
		new(model.TaskItem), 
		new(model.SSHPublicKey), 
		new(model.SharingDB),
		new(model.Certificate),
		new(model.CertificateRequest),
	)
	if err != nil {
		log.Fatalf("failed migrate database: %s", err.Error())
	}
}

func AutoMigrate(dst ...interface{}) error {
	var err error
	if conf.Conf.Database.Type == "mysql" {
		err = db.Set("gorm:table_options", "ENGINE=InnoDB CHARSET=utf8mb4").AutoMigrate(dst...)
	} else {
		err = db.AutoMigrate(dst...)
	}
	return err
}

func GetDb() *gorm.DB {
	return db
}

// 证书相关操作函数

// GetCertificates 获取所有证书
func GetCertificates() ([]*model.Certificate, error) {
	var certificates []*model.Certificate
	err := db.Find(&certificates).Error
	return certificates, err
}

// GetCertificateByID 根据ID获取证书
func GetCertificateByID(id uint) (*model.Certificate, error) {
	var certificate model.Certificate
	err := db.First(&certificate, id).Error
	return &certificate, err
}

// CreateCertificate 创建证书
func CreateCertificate(certificate *model.Certificate) error {
	return db.Create(certificate).Error
}

// UpdateCertificate 更新证书
func UpdateCertificate(certificate *model.Certificate) error {
	return db.Save(certificate).Error
}

// DeleteCertificate 删除证书
func DeleteCertificate(id uint) error {
	return db.Delete(&model.Certificate{}, id).Error
}

// GetCertificateRequests 获取所有证书申请
func GetCertificateRequests() ([]*model.CertificateRequest, error) {
	var requests []*model.CertificateRequest
	err := db.Find(&requests).Error
	return requests, err
}

// GetCertificateRequestByID 根据ID获取证书申请
func GetCertificateRequestByID(id uint) (*model.CertificateRequest, error) {
	var request model.CertificateRequest
	err := db.First(&request, id).Error
	return &request, err
}

// CreateCertificateRequest 创建证书申请
func CreateCertificateRequest(request *model.CertificateRequest) error {
	return db.Create(request).Error
}

// UpdateCertificateRequest 更新证书申请
func UpdateCertificateRequest(request *model.CertificateRequest) error {
	return db.Save(request).Error
}

// DeleteCertificateRequest 删除证书申请
func DeleteCertificateRequest(id uint) error {
	return db.Delete(&model.CertificateRequest{}, id).Error
}

func Close() {
	log.Info("closing db")
	sqlDB, err := db.DB()
	if err != nil {
		log.Errorf("failed to get db: %s", err.Error())
		return
	}
	err = sqlDB.Close()
	if err != nil {
		log.Errorf("failed to close db: %s", err.Error())
		return
	}
}