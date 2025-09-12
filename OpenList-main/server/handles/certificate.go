package handles

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"

	"github.com/OpenListTeam/OpenList/v4/internal/model"
	"github.com/OpenListTeam/OpenList/v4/internal/op"
	"github.com/OpenListTeam/OpenList/v4/server/common"
)

// CertificateList 获取证书列表
func CertificateList(c *gin.Context) {
	certificates, err := op.GetCertificates()
	if err != nil {
		common.ErrorResp(c, err, 500)
		return
	}
	common.SuccessResp(c, certificates)
}

// CertificateRequestList 获取证书申请列表
func CertificateRequestList(c *gin.Context) {
	requests, err := op.GetCertificateRequests()
	if err != nil {
		common.ErrorResp(c, err, 500)
		return
	}
	common.SuccessResp(c, requests)
}

// CreateCertificate 创建证书
func CreateCertificate(c *gin.Context) {
	var req struct {
		Name           string                  `json:"name" binding:"required"`
		Type           model.CertificateType   `json:"type" binding:"required"`
		Owner          string                  `json:"owner" binding:"required"`
		Content        string                  `json:"content"`
		IssuedDate     time.Time               `json:"issued_date"`
		ExpirationDate time.Time               `json:"expiration_date"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		common.ErrorResp(c, err, 400)
		return
	}

	certificate := &model.Certificate{
		Name:           req.Name,
		Type:           req.Type,
		Status:         model.CertificateStatusValid,
		Owner:          req.Owner,
		Content:        req.Content,
		IssuedDate:     req.IssuedDate,
		ExpirationDate: req.ExpirationDate,
	}

	if err := op.CreateCertificate(certificate); err != nil {
		common.ErrorResp(c, err, 500)
		return
	}

	common.SuccessResp(c, certificate)
}

// UpdateCertificate 更新证书
func UpdateCertificate(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		common.ErrorResp(c, errors.New("invalid id"), 400)
		return
	}

	certificate, err := op.GetCertificateByID(uint(id))
	if err != nil {
		common.ErrorResp(c, errors.New("certificate not found"), 404)
		return
	}

	if err := c.ShouldBindJSON(certificate); err != nil {
		common.ErrorResp(c, err, 400)
		return
	}

	if err := op.UpdateCertificate(certificate); err != nil {
		common.ErrorResp(c, err, 500)
		return
	}

	common.SuccessResp(c, certificate)
}

// DeleteCertificate 删除证书
func DeleteCertificate(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		common.ErrorResp(c, errors.New("invalid id"), 400)
		return
	}

	if err := op.DeleteCertificate(uint(id)); err != nil {
		common.ErrorResp(c, err, 500)
		return
	}

	common.SuccessResp(c, "Certificate deleted successfully")
}

// GetCertificate 获取单个证书
func GetCertificate(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		common.ErrorResp(c, errors.New("invalid id"), 400)
		return
	}

	certificate, err := op.GetCertificateByID(uint(id))
	if err != nil {
		common.ErrorResp(c, errors.New("certificate not found"), 404)
		return
	}

	common.SuccessResp(c, certificate)
}

// GetCertificateByID 获取单个证书（为了兼容路由）
func GetCertificateByID(c *gin.Context) {
	GetCertificate(c)
}

// CreateCertificateRequest 创建证书申请
func CreateCertificateRequest(c *gin.Context) {
	var req struct {
		UserName string                `json:"user_name" binding:"required"`
		Type     model.CertificateType `json:"type" binding:"required"`
		Reason   string                `json:"reason"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		common.ErrorResp(c, err, 400)
		return
	}

	request := &model.CertificateRequest{
		UserName: req.UserName,
		Type:     req.Type,
		Status:   model.CertificateStatusPending,
		Reason:   req.Reason,
	}

	if err := op.CreateCertificateRequest(request); err != nil {
		common.ErrorResp(c, err, 500)
		return
	}

	common.SuccessResp(c, request)
}

// ApproveCertificateRequest 批准证书申请
func ApproveCertificateRequest(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		common.ErrorResp(c, errors.New("invalid id"), 400)
		return
	}

	var req struct {
		ApprovedBy string `json:"approved_by" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		common.ErrorResp(c, err, 400)
		return
	}

	request, err := op.GetCertificateRequestByID(uint(id))
	if err != nil {
		common.ErrorResp(c, errors.New("certificate request not found"), 404)
		return
	}

	request.Status = model.CertificateStatusValid
	request.ApprovedBy = req.ApprovedBy
	now := time.Now()
	request.ApprovedAt = &now

	if err := op.UpdateCertificateRequest(request); err != nil {
		common.ErrorResp(c, err, 500)
		return
	}

	// 创建证书
	certificate := &model.Certificate{
		Name:           request.UserName + "-" + string(request.Type) + "-" + time.Now().Format("20060102"),
		Type:           request.Type,
		Status:         model.CertificateStatusValid,
		Owner:          request.UserName,
		IssuedDate:     time.Now(),
		ExpirationDate: time.Now().AddDate(1, 0, 0), // 1年有效期
	}

	if err := op.CreateCertificate(certificate); err != nil {
		common.ErrorResp(c, err, 500)
		return
	}

	common.SuccessResp(c, gin.H{
		"message": "Certificate request approved",
		"request": request,
		"certificate": certificate,
	})
}

// RejectCertificateRequest 拒绝证书申请
func RejectCertificateRequest(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		common.ErrorResp(c, errors.New("invalid id"), 400)
		return
	}

	var req struct {
		RejectedBy     string `json:"rejected_by" binding:"required"`
		RejectedReason string `json:"rejected_reason"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		common.ErrorResp(c, err, 400)
		return
	}

	request, err := op.GetCertificateRequestByID(uint(id))
	if err != nil {
		common.ErrorResp(c, errors.New("certificate request not found"), 404)
		return
	}

	request.Status = model.CertificateStatusRejected
	request.RejectedBy = req.RejectedBy
	now := time.Now()
	request.RejectedAt = &now
	request.RejectedReason = req.RejectedReason

	if err := op.UpdateCertificateRequest(request); err != nil {
		common.ErrorResp(c, err, 500)
		return
	}

	common.SuccessResp(c, gin.H{
		"message": "Certificate request rejected",
		"request": request,
	})
}