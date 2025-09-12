package handles

import (
	"strings"
	"crypto/rand"
	"encoding/hex"
	"net/url"
	"fmt"

	"github.com/OpenListTeam/OpenList/v4/internal/conf"
	"github.com/OpenListTeam/OpenList/v4/internal/model"
	"github.com/OpenListTeam/OpenList/v4/internal/op"
	"github.com/OpenListTeam/OpenList/v4/server/common"
	"github.com/gin-gonic/gin"
	"github.com/pquerna/otp/totp"
	log "github.com/sirupsen/logrus"
)

type LoginReq struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	OtpCode  string `json:"otp_code"`
}

type UserResp struct {
	model.User
	Otp bool `json:"otp"`
}

// CurrentUser get current user by token
// if token is empty, return guest user
func CurrentUser(c *gin.Context) {
	user := c.Request.Context().Value(conf.UserKey).(*model.User)
	userResp := UserResp{
		User: *user,
	}
	userResp.Password = ""
	if userResp.OtpSecret != "" {
		userResp.Otp = true
	}
	common.SuccessResp(c, userResp)
}

func UpdateCurrent(c *gin.Context) {
	var req model.User
	if err := c.ShouldBind(&req); err != nil {
		common.ErrorResp(c, err, 400)
		return
	}
	user := c.Request.Context().Value(conf.UserKey).(*model.User)
	req.ID = user.ID
	req.Username = user.Username
	req.Role = user.Role
	// can only update these fields
	user.OtpSecret = req.OtpSecret
	user.Password = req.Password
	user.SsoID = req.SsoID
	if err := op.UpdateUser(user); err != nil {
		common.ErrorResp(c, err, 500)
	} else {
		common.SuccessResp(c)
	}
}

// Login Deprecated
func Login(c *gin.Context) {
	var req LoginReq
	if err := c.ShouldBind(&req); err != nil {
		common.ErrorResp(c, err, 400)
		return
	}
	req.Password = model.StaticHash(req.Password)
	loginHash(c, &req)
}

// LoginHash login with password hashed by sha256
func LoginHash(c *gin.Context) {
	var req LoginReq
	if err := c.ShouldBind(&req); err != nil {
		common.ErrorResp(c, err, 400)
		return
	}
	loginHash(c, &req)
}

func loginHash(c *gin.Context, req *LoginReq) {
	ip := c.ClientIP()
	if whitelist, ok := model.Whitelist.Load().(map[string]bool); ok && whitelist[ip] {
		log.Debugf("whitelist ip: %s", ip)
	} else {
		count, ok := model.LoginCache.Get(ip)
		if ok && count >= model.DefaultMaxAuthRetries {
			common.ErrorStrResp(c, "Too many unsuccessful sign-in attempts have been made using an incorrect username or password, Try again later.", 429)
			model.LoginCache.Expire(ip, model.DefaultLockDuration)
			return
		}
	}

	user, err := op.GetUserByName(req.Username)
	if err != nil {
		common.ErrorResp(c, err, 400)
		if count, ok := model.LoginCache.Get(ip); ok {
			model.LoginCache.Set(ip, count+1)
		} else {
			model.LoginCache.Set(ip, 1)
		}
		return
	}
	if err := user.ValidatePwdStaticHash(req.Password); err != nil {
		common.ErrorResp(c, err, 400)
		if count, ok := model.LoginCache.Get(ip); ok {
			model.LoginCache.Set(ip, count+1)
		} else {
			model.LoginCache.Set(ip, 1)
		}
		return
	}
	if user.OtpSecret != "" {
		if !totp.Validate(req.OtpCode, user.OtpSecret) {
			common.ErrorStrResp(c, "Invalid 2FA code", 402)
			if count, ok := model.LoginCache.Get(ip); ok {
				model.LoginCache.Set(ip, count+1)
			} else {
				model.LoginCache.Set(ip, 1)
			}
			return
		}
	}
	
	token, err := common.GenerateToken(user)
	if err != nil {
		common.ErrorResp(c, err, 400, true)
		return
	}
	
	common.SuccessResp(c, gin.H{
		"token": token,
		"role":  user.Role, // 添加角色信息到响应
	})
	model.LoginCache.Del(ip)
}

type Generate2FAReq struct {
	Name string `json:"name"`
	Secret string `json:"secret"`
	Code string `json:"code"`
}

// 生成OTP配置URI
func generateOTPURL(secret, name string) string {
	// 构造标准的otpauth URI
	issuer := "OpenList"
	escapedName := url.QueryEscape(name)
	escapedIssuer := url.QueryEscape(issuer)
	return fmt.Sprintf("otpauth://totp/%s:%s?secret=%s&issuer=%s", escapedIssuer, escapedName, secret, escapedIssuer)
}

func Generate2FA(c *gin.Context) {
	user := c.Request.Context().Value(conf.UserKey).(*model.User)
	if user.OtpSecret != "" {
		common.ErrorStrResp(c, "2FA has been enabled", 400)
		return
	}
	var req Generate2FAReq
	if err := c.ShouldBind(&req); err != nil {
		common.ErrorResp(c, err, 400)
		return
	}
	if req.Secret == "" {
		bytes := make([]byte, 32)
		if _, err := rand.Read(bytes); err != nil {
			common.ErrorResp(c, err, 500)
			return
		}
		req.Secret = hex.EncodeToString(bytes)
	}
	if req.Name == "" {
		req.Name = user.Username
	}
	
	// 生成OTP URL
	url := generateOTPURL(req.Secret, req.Name)
	common.SuccessResp(c, gin.H{
		"secret": req.Secret,
		"qr": url,
	})
}

func Verify2FA(c *gin.Context) {
	user := c.Request.Context().Value(conf.UserKey).(*model.User)
	if user.OtpSecret != "" {
		common.ErrorStrResp(c, "2FA has been enabled", 400)
		return
	}
	var req Generate2FAReq
	if err := c.ShouldBind(&req); err != nil {
		common.ErrorResp(c, err, 400)
		return
	}
	if !totp.Validate(req.Code, req.Secret) {
		common.ErrorStrResp(c, "Invalid 2FA code", 400)
		return
	}
	user.OtpSecret = req.Secret
	if err := op.UpdateUser(user); err != nil {
		common.ErrorResp(c, err, 500)
	} else {
		common.SuccessResp(c)
	}
}

// TenantLogin 租户登录接口
func TenantLogin(c *gin.Context) {
	var req LoginReq
	if err := c.ShouldBind(&req); err != nil {
		common.ErrorResp(c, err, 400)
		return
	}
	
	ip := c.ClientIP()
	if whitelist, ok := model.Whitelist.Load().(map[string]bool); ok && whitelist[ip] {
		log.Debugf("whitelist ip: %s", ip)
	} else {
		count, ok := model.LoginCache.Get(ip)
		if ok && count >= model.DefaultMaxAuthRetries {
			common.ErrorStrResp(c, "Too many unsuccessful sign-in attempts have been made using an incorrect username or password, Try again later.", 429)
			model.LoginCache.Expire(ip, model.DefaultLockDuration)
			return
		}
	}

	user, err := op.GetUserByName(req.Username)
	if err != nil {
		common.ErrorResp(c, err, 400)
		if count, ok := model.LoginCache.Get(ip); ok {
			model.LoginCache.Set(ip, count+1)
		} else {
			model.LoginCache.Set(ip, 1)
		}
		return
	}
	
	// 检查用户是否为租户
	if user.Role != model.TENANT {
		common.ErrorStrResp(c, "User is not a tenant", 403)
		if count, ok := model.LoginCache.Get(ip); ok {
			model.LoginCache.Set(ip, count+1)
		} else {
			model.LoginCache.Set(ip, 1)
		}
		return
	}
	
	if err := user.ValidatePwdStaticHash(req.Password); err != nil {
		common.ErrorResp(c, err, 400)
		if count, ok := model.LoginCache.Get(ip); ok {
			model.LoginCache.Set(ip, count+1)
		} else {
			model.LoginCache.Set(ip, 1)
		}
		return
	}
	
	if user.OtpSecret != "" {
		if !totp.Validate(req.OtpCode, user.OtpSecret) {
			common.ErrorStrResp(c, "Invalid 2FA code", 402)
			if count, ok := model.LoginCache.Get(ip); ok {
				model.LoginCache.Set(ip, count+1)
			} else {
				model.LoginCache.Set(ip, 1)
			}
			return
		}
	}
	
	token, err := common.GenerateToken(user)
	if err != nil {
		common.ErrorResp(c, err, 400, true)
		return
	}
	
	common.SuccessResp(c, gin.H{
		"token": token,
		"role":  user.Role, // 添加角色信息到响应
	})
	model.LoginCache.Del(ip)
}

// LogOut logout
func LogOut(c *gin.Context) {
	token := c.GetHeader("Authorization")
	if strings.HasPrefix(token, "Bearer ") {
		token = token[7:]
	}
	// 将token加入黑名单
	common.InvalidateToken(token)
	common.SuccessResp(c)
}