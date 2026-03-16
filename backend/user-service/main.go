package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/meetup/backend/user-service/internal/config"
	"github.com/meetup/backend/user-service/internal/handlers"
	"github.com/meetup/backend/user-service/internal/middleware"
	"github.com/meetup/backend/user-service/internal/models"
	"github.com/meetup/backend/user-service/internal/repository"
	"github.com/meetup/backend/user-service/internal/services"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// @title Meetup App API
// @version 1.0
// @description API for Meetup social networking application
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.example.com/support
// @contact.email support@example.com

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host localhost:8081
// @BasePath /

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.
func main() {
	cfg := config.Load()

	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	if err := db.AutoMigrate(
		&models.User{},
		&models.Event{},
		&models.EventAttendee{},
		&models.Message{},
		&models.EventGroup{},
		&models.FriendRequest{},
		&models.Friendship{},
	); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	userRepo := repository.NewUserRepository(db)
	authService := services.NewAuthService(userRepo, cfg.JWTSecret)
	userService := services.NewUserService(userRepo)
	userHandler := handlers.NewUserHandler(authService, userService)

	r := gin.Default()

	r.Use(middleware.CORS())

	// Initialize rate limiter: 5 requests per minute per IP
	rateLimiter := middleware.NewRateLimiter(5.0/60, 10)
	go rateLimiter.CleanupOldVisitors()

	// Swagger docs
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Public routes with rate limiting
	public := r.Group("/")
	public.Use(middleware.RateLimitMiddleware(rateLimiter))
	{
		// @Summary Register new user
		// @Description Register a new user with email, username, password and profile information
		// @Tags Authentication
		// @Accept json
		// @Produce json
		// @Param user body services.RegisterInput true "User registration data"
		// @Success 201 {object} map[string]interface{}
		// @Router /register [post]
		public.POST("/register", userHandler.Register)

		// @Summary Login user
		// @Description Login with email and password
		// @Tags Authentication
		// @Accept json
		// @Produce json
		// @Param credentials body services.LoginInput true "Login credentials"
		// @Success 200 {object} map[string]interface{}
		// @Router /login [post]
		public.POST("/login", userHandler.Login)
	}

	// Protected routes
	authorized := r.Group("/")
	authorized.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	{
		// @Summary Get current user profile
		// @Description Get the profile of the currently authenticated user
		// @Tags Users
		// @Produce json
		// @Security BearerAuth
		// @Success 200 {object} models.UserResponse
		// @Router /profile [get]
		authorized.GET("/profile", userHandler.GetProfile)

		// @Summary Update user profile
		// @Description Update the profile of the currently authenticated user
		// @Tags Users
		// @Accept json
		// @Produce json
		// @Param profile body services.UpdateProfileInput true "Profile data"
		// @Security BearerAuth
		// @Success 200 {object} models.UserResponse
		// @Router /profile [put]
		authorized.PUT("/profile", userHandler.UpdateProfile)

		// @Summary Update user avatar
		// @Description Update the avatar URL of the currently authenticated user
		// @Tags Users
		// @Accept json
		// @Produce json
		// @Param avatar body map[string]string true "Avatar URL"
		// @Security BearerAuth
		// @Success 200 {object} models.UserResponse
		// @Router /profile/avatar [put]
		authorized.PUT("/profile/avatar", userHandler.UpdateAvatar)

		// @Summary Search users
		// @Description Search for users by username, first name or last name
		// @Tags Users
		// @Produce json
		// @Param q query string true "Search query"
		// @Param limit query int false "Results limit"
		// @Security BearerAuth
		// @Success 200 {array} models.UserResponse
		// @Router /users/search [get]
		authorized.GET("/users/search", userHandler.SearchUsers)

		// @Summary Get friend suggestions
		// @Description Get suggested friends for the current user
		// @Tags Friends
		// @Produce json
		// @Param limit query int false "Results limit"
		// @Security BearerAuth
		// @Success 200 {array} models.UserResponse
		// @Router /users/suggestions [get]
		authorized.GET("/users/suggestions", userHandler.GetFriendSuggestions)

		// @Summary Send friend request
		// @Description Send a friend request to another user
		// @Tags Friends
		// @Accept json
		// @Produce json
		// @Param request body services.SendFriendRequestInput true "Friend request"
		// @Security BearerAuth
		// @Success 200 {object} map[string]string
		// @Router /friends/request [post]
		authorized.POST("/friends/request", userHandler.SendFriendRequest)

		// @Summary Accept friend request
		// @Description Accept a pending friend request
		// @Tags Friends
		// @Produce json
		// @Param id path int true "Request ID"
		// @Security BearerAuth
		// @Success 200 {object} map[string]string
		// @Router /friends/request/{id}/accept [put]
		authorized.PUT("/friends/request/:id/accept", userHandler.AcceptFriendRequest)

		// @Summary Reject friend request
		// @Description Reject a pending friend request
		// @Tags Friends
		// @Produce json
		// @Param id path int true "Request ID"
		// @Security BearerAuth
		// @Success 200 {object} map[string]string
		// @Router /friends/request/{id}/reject [put]
		authorized.PUT("/friends/request/:id/reject", userHandler.RejectFriendRequest)

		// @Summary Get friends list
		// @Description Get all friends of the current user
		// @Tags Friends
		// @Produce json
		// @Security BearerAuth
		// @Success 200 {array} models.UserResponse
		// @Router /friends [get]
		authorized.GET("/friends", userHandler.GetFriends)

		// @Summary Remove friend
		// @Description Remove a friend from the current user's friend list
		// @Tags Friends
		// @Produce json
		// @Param id path int true "Friend ID"
		// @Security BearerAuth
		// @Success 200 {object} map[string]string
		// @Router /friends/{id} [delete]
		authorized.DELETE("/friends/:id", userHandler.RemoveFriend)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = cfg.Port
	}
	r.Run(":" + port)
}
