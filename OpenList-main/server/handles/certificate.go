package handles

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"
	"gorm.io/gorm"

	"github.com/OpenListTeam/OpenList/v4/internal/conf"
	"github.com/OpenListTeam/OpenList/v4/internal/errs"
	"github.com/OpenListTeam/OpenList/v4/internal/model"
	"github.com/OpenListTeam/OpenList/v4/internal/op"
	"github.com/OpenListTeam/OpenList/v4/server/common"
)

// --- Admin Handlers ---

// CertificateList 获取证书列表，增加了分页功能，与ListUsers风格统一
func CertificateList(c *gin.Context) {
	var req model.PageReq
	if err := c.ShouldBind(&req); err != nil {
		common.ErrorResp(c, err, 400)
		return
	}
	req.Validate()
	certs, total, err := op.GetCertificates(req.Page, req.PerPage)
	if err != nil {
		common.ErrorResp(c, err, 500)
		return
	}
	common.SuccessResp(c, common.PageResp{
		Content: certs,
		Total:   total,
	})
}

// CreateCertificate 创建证书
func CreateCertificate(c *gin.Context) {
	var req struct {
		Name           string    `json:"name" binding:"required"`
		Type           string    `json:"type" binding:"required"`
		Owner          string    `json:"owner"`
		OwnerID        uint      `json:"owner_id"`
		Content        string    `json:"content" binding:"required"`
		IssuedDate     time.Time `json:"issued_date"`
		ExpirationDate time.Time `json:"expiration_date" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ErrorResp(c, err, 400)
		return
	}

	cert := &model.Certificate{
		Name:           req.Name,
		Type:           model.CertificateType(req.Type),
		Owner:          req.Owner,
		OwnerID:        req.OwnerID,
		Content:        req.Content,
		IssuedDate:     req.IssuedDate,
		ExpirationDate: req.ExpirationDate,
		Status:         model.CertificateStatusValid,
	}
	
	// 调用服务层创建证书
	err := op.CreateCertificate(cert)
	if err != nil {
		common.ErrorResp(c, err, 500)
		return
	}
	common.SuccessResp(c, cert)
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
		Reason:   req.Reason,
		Status:   model.CertificateStatusPending,
	}

	// 调用服务层创建证书申请
	err := op.CreateCertificateRequest(request)
	if err != nil {
		common.ErrorResp(c, err, 500)
		return
	}
	common.SuccessResp(c, request)
}

// CertificateRequestList 获取证书申请列表，增加了分页功能
func CertificateRequestList(c *gin.Context) {
	var req model.PageReq
	if err := c.ShouldBind(&req); err != nil {
		common.ErrorResp(c, err, 400)
		return
	}
	req.Validate()
	requests, total, err := op.GetCertificateRequests(req.Page, req.PerPage)
	if err != nil {
		common.ErrorResp(c, err, 500)
		return
	}
	common.SuccessResp(c, common.PageResp{
		Content: requests,
		Total:   total,
	})
}

// UpdateCertificate 更新证书信息，如有效期等
func UpdateCertificate(c *gin.Context) {
	id, err := getIDFromParam(c)
	if err != nil {
		common.ErrorResp(c, err, 400)
		return
	}
	var req struct {
		Name           string `json:"name" binding:"required"`
		ExpirationDate string `json:"expiration_date" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ErrorResp(c, err, 400)
		return
	}
	expDate, err := time.Parse("2006-01-02", req.ExpirationDate)
	if err != nil {
		common.ErrorResp(c, errors.New("invalid expiration_date format, expected YYYY-MM-DD"), 400)
		return
	}

	// 调用服务层进行更新，控制器不关心实现
	cert, err := op.UpdateCertificateDetails(id, req.Name, expDate)
	if err != nil {
		common.ErrorResp(c, err, 500)
		return
	}
	common.SuccessResp(c, cert)
}

// DeleteCertificate 删除证书
func DeleteCertificate(c *gin.Context) {
	id, err := getIDFromParam(c)
	if err != nil {
		common.ErrorResp(c, err, 400)
		return
	}
	if err := op.DeleteCertificate(id); err != nil {
		common.ErrorResp(c, err, 500)
		return
	}
	common.SuccessResp(c)
}

// ApproveCertificateRequest 批准证书申请，将复杂业务逻辑移至服务层
func ApproveCertificateRequest(c *gin.Context) {
	id, err := getIDFromParam(c)
	if err != nil {
		common.ErrorResp(c, err, 400)
		return
	}
	adminUser := c.MustGet(string(conf.UserKey)).(*model.User)
	// 单一调用，封装了所有批准和创建的逻辑
	cert, err := op.ApproveAndCreateCertificate(id, adminUser)
	if err != nil {
		common.ErrorResp(c, err, 500)
		return
	}
	common.SuccessResp(c, cert)
}

// RejectCertificateRequest 拒绝证书申请
func RejectCertificateRequest(c *gin.Context) {
	id, err := getIDFromParam(c)
	if err != nil {
		common.ErrorResp(c, err, 400)
		return
	}
	var req struct {
		Reason string `json:"reason" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ErrorResp(c, err, 400)
		return
	}
	adminUser := c.MustGet(string(conf.UserKey)).(*model.User)
	request, err := op.RejectCertificateRequest(id, adminUser, req.Reason)
	if err != nil {
		common.ErrorResp(c, err, 500)
		return
	}
	common.SuccessResp(c, request)
}

// RevokeCertificate 吊销证书
func RevokeCertificate(c *gin.Context) {
	id, err := getIDFromParam(c)
	if err != nil {
		common.ErrorResp(c, err, 400)
		return
	}
	if err := op.RevokeCertificate(id); err != nil {
		common.ErrorResp(c, err, 500)
		return
	}
	common.SuccessResp(c)
}

// --- Tenant Handlers ---

// GetTenantCertificate 获取租户自己的证书
func GetTenantCertificate(c *gin.Context) {
	// FINAL FIX: Use c.Request.Context().Value() to retrieve the user
	_user := c.Request.Context().Value(conf.UserKey)
	if _user == nil {
		common.ErrorResp(c, errors.New("user not found in context"), http.StatusUnauthorized)
		return
	}
	user := _user.(*model.User)

	certificate, err := op.GetCertificateForTenant(user.ID)
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			common.ErrorResp(c, err, 500)
			return
		}
		common.SuccessResp(c, nil)
		return
	}

	common.SuccessResp(c, certificate)
}

// GetTenantCertificateRequests 获取租户自己的证书申请
func GetTenantCertificateRequests(c *gin.Context) {
	// FINAL FIX: Use c.Request.Context().Value() to retrieve the user
	_user := c.Request.Context().Value(conf.UserKey)
	if _user == nil {
		common.ErrorResp(c, errors.New("user not found in context"), http.StatusUnauthorized)
		return
	}
	user := _user.(*model.User)

	requests, err := op.GetTenantCertificateRequests(user.ID)
	if err != nil {
		common.ErrorResp(c, err, 500)
		return
	}

	common.SuccessResp(c, requests)
}

// CreateTenantCertificateRequest 租户创建证书申请
func CreateTenantCertificateRequest(c *gin.Context) {
	// 1. 安全地从上下文中获取用户
	_user := c.Request.Context().Value(conf.UserKey)
	if _user == nil {
		common.ErrorResp(c, errors.New("user not found in context"), http.StatusUnauthorized)
		return
	}
	user := _user.(*model.User)

	// 2. 绑定请求的 JSON 数据
	var req struct {
		Type   model.CertificateType `json:"type" binding:"required"`
		Reason string                `json:"reason"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ErrorResp(c, err, 400)
		return
	}

	// 3. 使用op包中的业务逻辑函数处理申请
	request, err := op.CreateTenantCertificateRequest(user, req.Type, req.Reason)
	if err != nil {
		if errors.Is(err, errs.CertificateAlreadyExists) || errors.Is(err, errs.CertificateRequestPending) {
			common.ErrorResp(c, err, 409)
		} else {
			common.ErrorResp(c, err, 500)
		}
		return
	}

	common.SuccessResp(c, request)
}

// DownloadCertificate 租户下载自己的证书
func DownloadCertificate(c *gin.Context) {
	user := c.MustGet(string(conf.UserKey)).(*model.User)
	cert, err := op.GetCertificateForTenant(user.ID)
	if err != nil {
		common.ErrorResp(c, err, 500)
		return
	}
	if cert == nil {
		common.ErrorResp(c, errors.New("certificate not found"), 404)
		return
	}
	if cert.Status != model.CertificateStatusValid && cert.Status != model.CertificateStatusExpiring {
		common.ErrorResp(c, errors.New("certificate is not available for download"), 403)
		return
	}
	
	// 检查证书是否过期
	if cert.IsExpired() {
		common.ErrorResp(c, errors.New("certificate has expired"), 403)
		return
	}

	c.Header("Content-Disposition", "attachment; filename="+cert.Name+".crt")
	c.Data(http.StatusOK, "application/x-x509-ca-cert", []byte(cert.Content))
}
