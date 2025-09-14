package handles

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"

	"github.com/OpenListTeam/OpenList/v4/internal/model"
	"github.com/OpenListTeam/OpenList/v4/internal/op"
	"github.com/OpenListTeam/OpenList/v4/server/common"
	"github.com/OpenListTeam/OpenList/v4/internal/conf"
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
		OwnerID        uint                    `json:"owner_id"`
		Content        string                  `json:"content"`
		IssuedDate     string                  `json:"issued_date"`     // 修改为字符串类型
		ExpirationDate string                  `json:"expiration_date"` // 修改为字符串类型
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		common.ErrorResp(c, err, 400)
		return
	}

	// 解析日期字符串
	issuedDate, err := time.Parse("2006-01-02", req.IssuedDate)
	if err != nil {
		common.ErrorResp(c, errors.New("invalid issued_date format, expected YYYY-MM-DD"), 400)
		return
	}

	expirationDate, err := time.Parse("2006-01-02", req.ExpirationDate)
	if err != nil {
		common.ErrorResp(c, errors.New("invalid expiration_date format, expected YYYY-MM-DD"), 400)
		return
	}

	certificate := &model.Certificate{
		Name:           req.Name,
		Type:           req.Type,
		Status:         model.CertificateStatusValid,
		Owner:          req.Owner,
		OwnerID:        req.OwnerID,
		Content:        req.Content,
		IssuedDate:     issuedDate,
		ExpirationDate: expirationDate,
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

	var req struct {
		Name           *string `json:"name"`
		Type           *model.CertificateType `json:"type"`
		Owner          *string `json:"owner"`
		OwnerID        *uint   `json:"owner_id"`
		Content        *string `json:"content"`
		IssuedDate     *string `json:"issued_date"`     // 修改为字符串指针类型
		ExpirationDate *string `json:"expiration_date"` // 修改为字符串指针类型
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		common.ErrorResp(c, err, 400)
		return
	}

	// 更新字段
	if req.Name != nil {
		certificate.Name = *req.Name
	}
	if req.Type != nil {
		certificate.Type = *req.Type
	}
	if req.Owner != nil {
		certificate.Owner = *req.Owner
	}
	if req.OwnerID != nil {
		certificate.OwnerID = *req.OwnerID
	}
	if req.Content != nil {
		certificate.Content = *req.Content
	}
	if req.IssuedDate != nil {
		issuedDate, err := time.Parse("2006-01-02", *req.IssuedDate)
		if err != nil {
			common.ErrorResp(c, errors.New("invalid issued_date format, expected YYYY-MM-DD"), 400)
			return
		}
		certificate.IssuedDate = issuedDate
	}
	if req.ExpirationDate != nil {
		expirationDate, err := time.Parse("2006-01-02", *req.ExpirationDate)
		if err != nil {
			common.ErrorResp(c, errors.New("invalid expiration_date format, expected YYYY-MM-DD"), 400)
			return
		}
		certificate.ExpirationDate = expirationDate
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

// GetTenantCertificates 获取租户自己的证书
func GetTenantCertificates(c *gin.Context) {
	// 获取当前用户信息
	user := c.MustGet(string(conf.UserKey)).(*model.User)
	
	// 根据用户ID获取证书
	certificates, err := op.GetCertificatesByOwnerID(user.ID)
	if err != nil {
		// 如果出错，尝试通过用户名获取
		certificates, err = op.GetCertificatesByOwner(user.Username)
		if err != nil {
			common.ErrorResp(c, err, 500)
			return
		}
	}
	
	common.SuccessResp(c, certificates)
}

// CreateCertificateRequest 创建证书申请
func CreateCertificateRequest(c *gin.Context) {
	var req struct {
		UserName string                `json:"user_name" binding:"required"`
		UserID   uint                  `json:"user_id"`
		Type     model.CertificateType `json:"type" binding:"required"`
		Reason   string                `json:"reason"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		common.ErrorResp(c, err, 400)
		return
	}

	request := &model.CertificateRequest{
		UserName: req.UserName,
		UserID:   req.UserID,
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

// CreateTenantCertificateRequest 租户创建证书申请
func CreateTenantCertificateRequest(c *gin.Context) {
	// 获取当前用户信息
	user := c.MustGet(string(conf.UserKey)).(*model.User)
	
	var req struct {
		Type   model.CertificateType `json:"type" binding:"required"`
		Reason string                `json:"reason"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		common.ErrorResp(c, err, 400)
		return
	}

	request := &model.CertificateRequest{
		UserName: user.Username,
		UserID:   user.ID,
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
		OwnerID:        request.UserID,
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

// DownloadCertificate 下载证书
func DownloadCertificate(c *gin.Context) {
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

	// 设置响应头以触发下载
	c.Header("Content-Type", "application/octet-stream")
	c.Header("Content-Disposition", "attachment; filename="+certificate.Name+".crt")
	c.String(http.StatusOK, certificate.Content)
}