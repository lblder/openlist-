// file: server/middlewares/auth.go

package middlewares

import (
	"crypto/subtle"
	"errors"
	"net/http"

	"github.com/OpenListTeam/OpenList/v4/internal/conf"
	"github.com/OpenListTeam/OpenList/v4/internal/model"
	"github.com/OpenListTeam/OpenList/v4/internal/op"
	"github.com/OpenListTeam/OpenList/v4/internal/setting"
	"github.com/OpenListTeam/OpenList/v4/server/common"
	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

// Auth is a middleware that checks if the user is logged in.
// if token is empty, set user to guest
func Auth(allowDisabledGuest bool) func(c *gin.Context) {
	return func(c *gin.Context) {
		log.Infof("--- [Auth Middleware] --- Request received for: %s", c.Request.URL.Path)
		token := c.GetHeader("Authorization")

		// 1. Admin Token Check
		if subtle.ConstantTimeCompare([]byte(token), []byte(setting.GetStr(conf.Token))) == 1 {
			admin, err := op.GetAdmin()
			if err != nil {
				log.Errorf("[Auth Middleware] CRITICAL: Failed to get admin user: %v", err)
				common.ErrorResp(c, err, 500)
				c.Abort()
				return
			}
			log.Infof("[Auth Middleware] SUCCESS: Authenticated as ADMIN via admin token.")
			common.GinWithValue(c, conf.UserKey, admin)
			c.Next()
			return
		}

		// 2. Guest Check (No Token)
		if token == "" {
			log.Infof("[Auth Middleware] No token provided. Treating as GUEST.")
			guest, err := op.GetGuest()
			if err != nil {
				log.Errorf("[Auth Middleware] CRITICAL: Failed to get guest user: %v", err)
				common.ErrorResp(c, err, 500)
				c.Abort()
				return
			}
			if !allowDisabledGuest && guest.Disabled {
				log.Warnf("[Auth Middleware] FAILED: Guest user is disabled. Aborting.")
				common.ErrorStrResp(c, "Guest user is disabled, login please", 401)
				c.Abort()
				return
			}
			log.Infof("[Auth Middleware] SUCCESS: Authenticated as GUEST.")
			common.GinWithValue(c, conf.UserKey, guest)
			c.Next()
			return
		}

		// 3. Parse User Token
		log.Infof("[Auth Middleware] Token found, attempting to parse...")
		userClaims, err := common.ParseToken(token)
		if err != nil {
			log.Errorf("[Auth Middleware] FAILED: Token parsing failed. Error: %v", err)
			common.ErrorResp(c, err, 401)
			c.Abort()
			return
		}
		log.Infof("[Auth Middleware] Token parsed successfully for user: '%s'", userClaims.Username)

		// 4. Get User from Database
		log.Infof("[Auth Middleware] Attempting to retrieve user '%s' from database...", userClaims.Username)
		user, err := op.GetUserByName(userClaims.Username)
		if err != nil {
			log.Errorf("[Auth Middleware] FAILED: GetUserByName for '%s' failed. Error: %v", userClaims.Username, err)
			common.ErrorResp(c, err, 401)
			c.Abort()
			return
		}
		log.Infof("[Auth Middleware] Successfully retrieved user object from DB: %+v", user)

		// 5. Validate Password Timestamp
		if userClaims.PwdTS != user.PwdTS {
			log.Warnf("[Auth Middleware] FAILED: Password timestamp mismatch for user '%s'. Aborting.", user.Username)
			common.ErrorStrResp(c, "Password has been changed, login please", 401)
			c.Abort()
			return
		}
		log.Infof("[Auth Middleware] Password timestamp check passed for user '%s'.", user.Username)


		// 6. Check if User is Disabled
		if user.Disabled {
			log.Warnf("[Auth Middleware] FAILED: User '%s' is disabled. Aborting.", user.Username)
			common.ErrorStrResp(c, "Current user is disabled, replace please", 401)
			c.Abort()
			return
		}
		log.Infof("[Auth Middleware] Disabled check passed for user '%s'.", user.Username)

		// 7. Role Validation Check
		isValidRole := user.Role == model.ADMIN || user.Role == model.GENERAL || user.Role == model.TENANT
		if !isValidRole || user.Role == model.GUEST {
			log.Warnf("[Auth Middleware] FAILED: User '%s' blocked due to invalid role: %d. Aborting.", user.Username, user.Role)
			common.ErrorResp(c, errors.New("user role is not permitted to access this API"), http.StatusForbidden)
			c.Abort()
			return
		}
		log.Infof("[Auth Middleware] Role check passed for user '%s' with role '%d'.", user.Username, user.Role)

		// 8. Success
		log.Infof("[Auth Middleware] SUCCESS: All checks passed for user '%s'. Setting user in context and proceeding.", user.Username)
		common.GinWithValue(c, conf.UserKey, user)
		c.Next()
	}
}

func Authn(c *gin.Context) {
	token := c.GetHeader("Authorization")
	if subtle.ConstantTimeCompare([]byte(token), []byte(setting.GetStr(conf.Token))) == 1 {
		admin, err := op.GetAdmin()
		if err != nil {
			common.ErrorResp(c, err, 500)
			c.Abort()
			return
		}
		common.GinWithValue(c, conf.UserKey, admin)
		log.Debugf("use admin token: %+v", admin)
		c.Next()
		return
	}
	if token == "" {
		guest, err := op.GetGuest()
		if err != nil {
			common.ErrorResp(c, err, 500)
			c.Abort()
			return
		}
		common.GinWithValue(c, conf.UserKey, guest)
		log.Debugf("use empty token: %+v", guest)
		c.Next()
		return
	}
	userClaims, err := common.ParseToken(token)
	if err != nil {
		common.ErrorResp(c, err, 401)
		c.Abort()
		return
	}
	user, err := op.GetUserByName(userClaims.Username)
	if err != nil {
		common.ErrorResp(c, err, 401)
		c.Abort()
		return
	}
	// validate password timestamp
	if userClaims.PwdTS != user.PwdTS {
		common.ErrorStrResp(c, "Password has been changed, login please", 401)
		c.Abort()
		return
	}
	if user.Disabled {
		common.ErrorStrResp(c, "Current user is disabled, replace please", 401)
		c.Abort()
		return
	}
	common.GinWithValue(c, conf.UserKey, user)
	log.Debugf("use login token: %+v", user)
	c.Next()
}

func AuthNotGuest(c *gin.Context) {
	user := c.Request.Context().Value(conf.UserKey).(*model.User)
	if user.IsGuest() {
		common.ErrorStrResp(c, "You are a guest", 403)
		c.Abort()
	} else {
		c.Next()
	}
}

func AuthAdmin(c *gin.Context) {
	user := c.Request.Context().Value(conf.UserKey).(*model.User)
	if !user.IsAdmin() {
		common.ErrorStrResp(c, "You are not an admin", 403)
		c.Abort()
	} else {
		c.Next()
	}
}