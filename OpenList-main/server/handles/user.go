package handles

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"

	"github.com/OpenListTeam/OpenList/v4/internal/conf"
	"github.com/OpenListTeam/OpenList/v4/internal/model"
	"github.com/OpenListTeam/OpenList/v4/internal/op"
	"github.com/OpenListTeam/OpenList/v4/server/common"
)

// --- User Management ---

// ListUsers 列出用户
func ListUsers(c *gin.Context) {
	var req model.PageReq
	if err := c.ShouldBind(&req); err != nil {
		common.ErrorResp(c, err, 400)
		return
	}
	req.Validate()
	users, total, err := op.GetUsers(req.Page, req.PerPage)
	if err != nil {
		common.ErrorResp(c, err, 500)
		return
	}
	common.SuccessResp(c, common.PageResp{
		Content: users,
		Total:   total,
	})
}

// GetUser 获取用户信息
func GetUser(c *gin.Context) {
	idStr := c.Query("id")
	if idStr == "" {
		common.ErrorResp(c, errors.New("missing id parameter"), 400)
		return
	}
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		common.ErrorResp(c, errors.New("invalid ID format"), 400)
		return
	}
	user, err := op.GetUserById(uint(id))
	if err != nil {
		common.ErrorResp(c, err, 500)
		return
	}
	common.SuccessResp(c, user)
}

// CreateUser 创建用户
func CreateUser(c *gin.Context) {
	var req model.User
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ErrorResp(c, err, 400)
		return
	}
	if err := op.CreateUser(&req); err != nil {
		common.ErrorResp(c, err, 500)
		return
	}
	common.SuccessResp(c, "User created successfully")
}

// UpdateUser 更新用户
func UpdateUser(c *gin.Context) {
	id, err := getIDFromParam(c)
	if err != nil {
		common.ErrorResp(c, err, 400)
		return
	}
	var req model.User
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ErrorResp(c, err, 400)
		return
	}
	req.ID = id
	if err := op.UpdateUser(&req); err != nil {
		common.ErrorResp(c, err, 500)
		return
	}
	common.SuccessResp(c, "User updated successfully")
}

// Cancel2FAById 取消用户两步验证
func Cancel2FAById(c *gin.Context) {
	id, err := getIDFromParam(c)
	if err != nil {
		common.ErrorResp(c, err, 400)
		return
	}
	if err := op.Cancel2FAById(id); err != nil {
		common.ErrorResp(c, err, 500)
		return
	}
	common.SuccessResp(c, "2FA canceled successfully")
}

// DeleteUser 删除用户
func DeleteUser(c *gin.Context) {
	id, err := getIDFromParam(c)
	if err != nil {
		common.ErrorResp(c, err, 400)
		return
	}
	if err := op.DeleteUserById(id); err != nil {
		common.ErrorResp(c, err, 500)
		return
	}
	common.SuccessResp(c, "User deleted successfully")
}

// DelUserCache 删除用户缓存
func DelUserCache(c *gin.Context) {
	id, err := getIDFromParam(c)
	if err != nil {
		common.ErrorResp(c, err, 400)
		return
	}
	if err := op.DelUserCache(strconv.FormatUint(uint64(id), 10)); err != nil {
		common.ErrorResp(c, err, 500)
		return
	}
	common.SuccessResp(c, "User cache deleted successfully")
}

// --- Admin Handlers ---

// AdminSettingGet 获取站点配置
func AdminSettingGet(c *gin.Context) {
	// 从数据库中获取设置
	s, err := op.GetSetting()
	if err != nil {
		common.ErrorResp(c, err, 500)
		return
	}
	common.SuccessResp(c, s)
}

// AdminCertificateRequestList 获取证书申请列表，增加了分页功能
func AdminCertificateRequestList(c *gin.Context) {
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

// UpdateAdminCertificate 更新证书信息，如有效期等
func UpdateAdminCertificate(c *gin.Context) {
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

// DeleteAdminCertificate 删除证书
func DeleteAdminCertificate(c *gin.Context) {
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

// ApproveAdminCertificateRequest 批准证书申请，将复杂业务逻辑移至服务层
func ApproveAdminCertificateRequest(c *gin.Context) {
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

// RejectAdminCertificateRequest 拒绝证书申请
func RejectAdminCertificateRequest(c *gin.Context) {
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

// AdminRevokeCertificate 吊销证书
func AdminRevokeCertificate(c *gin.Context) {
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

// GetTenantUserCertificate 获取租户自己的证书，逻辑清晰
func GetTenantUserCertificate(c *gin.Context) {
	user := c.MustGet(string(conf.UserKey)).(*model.User)
	cert, err := op.GetCertificateForTenant(user.ID)
	if err != nil {
		common.ErrorResp(c, err, 500)
		return
	}
	common.SuccessResp(c, cert)
}

// getIDFromParam 辅助函数，减少重复代码
func getIDFromParam(c *gin.Context) (uint, error) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		return 0, errors.New("invalid ID format")
	}
	return uint(id), nil
}