package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/meetup/backend/user-service/internal/services"
	"net/http"
	"strconv"
)

// UserHandler handles user-related HTTP requests
type UserHandler struct {
	authService *services.AuthService
	userService *services.UserService
}

// NewUserHandler creates a new UserHandler with the given services
func NewUserHandler(authService *services.AuthService, userService *services.UserService) *UserHandler {
	return &UserHandler{
		authService: authService,
		userService: userService,
	}
}

// Register godoc
// @Summary Register new user
// @Description Register a new user with email, username, password and profile information
// @Tags Authentication
// @Accept json
// @Produce json
// @Param user body services.RegisterInput true "User registration data"
// @Success 201 {object} map[string]interface{}
// @Router /register [post]
func (h *UserHandler) Register(c *gin.Context) {
	var input services.RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, token, err := h.authService.Register(input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"user":  user,
		"token": token,
	})
}

// Login godoc
// @Summary Login user
// @Description Login with email and password
// @Tags Authentication
// @Accept json
// @Produce json
// @Param credentials body services.LoginInput true "Login credentials"
// @Success 200 {object} map[string]interface{}
// @Router /login [post]
func (h *UserHandler) Login(c *gin.Context) {
	var input services.LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, token, err := h.authService.Login(input)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user":  user,
		"token": token,
	})
}

// GetProfile godoc
// @Summary Get current user profile
// @Description Get the profile of the currently authenticated user
// @Tags Users
// @Produce json
// @Security BearerAuth
// @Success 200 {object} models.UserResponse
// @Router /profile [get]
func (h *UserHandler) GetProfile(c *gin.Context) {
	userID := c.GetUint("user_id")

	user, err := h.userService.GetProfile(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// UpdateProfile godoc
// @Summary Update user profile
// @Description Update the profile of the currently authenticated user
// @Tags Users
// @Accept json
// @Produce json
// @Param profile body services.UpdateProfileInput true "Profile data"
// @Security BearerAuth
// @Success 200 {object} models.UserResponse
// @Router /profile [put]
func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID := c.GetUint("user_id")

	var input services.UpdateProfileInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.userService.UpdateProfile(userID, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, user)
}

// UpdateAvatar godoc
// @Summary Update user avatar
// @Description Update the avatar URL of the currently authenticated user
// @Tags Users
// @Accept json
// @Produce json
// @Param avatar body map[string]string true "Avatar URL"
// @Security BearerAuth
// @Success 200 {object} models.UserResponse
// @Router /profile/avatar [put]
func (h *UserHandler) UpdateAvatar(c *gin.Context) {
	userID := c.GetUint("user_id")

	var input struct {
		AvatarURL string `json:"avatar_url" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.userService.UpdateAvatar(userID, input.AvatarURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, user)
}

// SearchUsers godoc
// @Summary Search users
// @Description Search for users by username, first name or last name
// @Tags Users
// @Produce json
// @Param q query string true "Search query"
// @Param limit query int false "Results limit"
// @Security BearerAuth
// @Success 200 {array} models.UserResponse
// @Router /users/search [get]
func (h *UserHandler) SearchUsers(c *gin.Context) {
	query := c.Query("q")
	limitStr := c.DefaultQuery("limit", "20")
	limit, _ := strconv.Atoi(limitStr)

	users, err := h.userService.SearchUsers(query, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, users)
}

// GetFriendSuggestions godoc
// @Summary Get friend suggestions
// @Description Get suggested friends for the current user
// @Tags Friends
// @Produce json
// @Param limit query int false "Results limit"
// @Security BearerAuth
// @Success 200 {array} models.UserResponse
// @Router /users/suggestions [get]
func (h *UserHandler) GetFriendSuggestions(c *gin.Context) {
	userID := c.GetUint("user_id")
	limitStr := c.DefaultQuery("limit", "10")
	limit, _ := strconv.Atoi(limitStr)

	users, err := h.userService.GetFriendSuggestions(userID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, users)
}

// SendFriendRequest godoc
// @Summary Send friend request
// @Description Send a friend request to another user
// @Tags Friends
// @Accept json
// @Produce json
// @Param request body services.SendFriendRequestInput true "Friend request"
// @Security BearerAuth
// @Success 200 {object} map[string]string
// @Router /friends/request [post]
func (h *UserHandler) SendFriendRequest(c *gin.Context) {
	userID := c.GetUint("user_id")

	var input services.SendFriendRequestInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.userService.SendFriendRequest(userID, input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "friend request sent"})
}

// AcceptFriendRequest godoc
// @Summary Accept friend request
// @Description Accept a pending friend request
// @Tags Friends
// @Produce json
// @Param id path int true "Request ID"
// @Security BearerAuth
// @Success 200 {object} map[string]string
// @Router /friends/request/{id}/accept [put]
func (h *UserHandler) AcceptFriendRequest(c *gin.Context) {
	userID := c.GetUint("user_id")
	requestID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	if err := h.userService.AcceptFriendRequest(userID, uint(requestID)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "friend request accepted"})
}

// RejectFriendRequest godoc
// @Summary Reject friend request
// @Description Reject a pending friend request
// @Tags Friends
// @Produce json
// @Param id path int true "Request ID"
// @Security BearerAuth
// @Success 200 {object} map[string]string
// @Router /friends/request/{id}/reject [put]
func (h *UserHandler) RejectFriendRequest(c *gin.Context) {
	userID := c.GetUint("user_id")
	requestID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	if err := h.userService.RejectFriendRequest(userID, uint(requestID)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "friend request rejected"})
}

// GetFriends godoc
// @Summary Get friends list
// @Description Get all friends of the current user
// @Tags Friends
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.UserResponse
// @Router /friends [get]
func (h *UserHandler) GetFriends(c *gin.Context) {
	userID := c.GetUint("user_id")

	users, err := h.userService.GetFriends(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, users)
}

// RemoveFriend godoc
// @Summary Remove friend
// @Description Remove a friend from the current user's friend list
// @Tags Friends
// @Produce json
// @Param id path int true "Friend ID"
// @Security BearerAuth
// @Success 200 {object} map[string]string
// @Router /friends/{id} [delete]
func (h *UserHandler) RemoveFriend(c *gin.Context) {
	userID := c.GetUint("user_id")
	friendID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	if err := h.userService.RemoveFriend(userID, uint(friendID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "friend removed"})
}
