package main

import (
	"log"
	"net/http/httputil"
	"net/url"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/meetup/backend/api-gateway/internal/config"
	"github.com/meetup/backend/api-gateway/internal/middleware"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title API Gateway
// @version 1.0
// @description API Gateway for Meetup social networking application
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.example.com/support
// @contact.email support@example.com

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host localhost:8080
// @BasePath /

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.
func main() {
	cfg := config.Load()

	r := gin.Default()

	r.Use(middleware.CORS())

	// Swagger docs
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Define service URLs
	userServiceURL, _ := url.Parse("http://localhost:8081")
	eventServiceURL, _ := url.Parse("http://localhost:8082")
	messageServiceURL, _ := url.Parse("http://localhost:8083")

	// Create reverse proxies
	userProxy := httputil.NewSingleHostReverseProxy(userServiceURL)
	eventProxy := httputil.NewSingleHostReverseProxy(eventServiceURL)
	messageProxy := httputil.NewSingleHostReverseProxy(messageServiceURL)

	// User service routes
	r.Any("/register", func(c *gin.Context) {
		userProxy.ServeHTTP(c.Writer, c.Request)
	})
	r.Any("/login", func(c *gin.Context) {
		userProxy.ServeHTTP(c.Writer, c.Request)
	})

	// Protected user routes
	authorized := r.Group("/")
	authorized.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	{
		authorized.Any("/profile", func(c *gin.Context) {
			userProxy.ServeHTTP(c.Writer, c.Request)
		})
		authorized.Any("/profile/avatar", func(c *gin.Context) {
			userProxy.ServeHTTP(c.Writer, c.Request)
		})
		authorized.Any("/users/search", func(c *gin.Context) {
			userProxy.ServeHTTP(c.Writer, c.Request)
		})
		authorized.Any("/users/suggestions", func(c *gin.Context) {
			userProxy.ServeHTTP(c.Writer, c.Request)
		})
		authorized.Any("/friends/request", func(c *gin.Context) {
			userProxy.ServeHTTP(c.Writer, c.Request)
		})
		authorized.Any("/friends/request/:id/accept", func(c *gin.Context) {
			userProxy.ServeHTTP(c.Writer, c.Request)
		})
		authorized.Any("/friends/request/:id/reject", func(c *gin.Context) {
			userProxy.ServeHTTP(c.Writer, c.Request)
		})
		authorized.Any("/friends", func(c *gin.Context) {
			userProxy.ServeHTTP(c.Writer, c.Request)
		})
		authorized.Any("/friends/:id", func(c *gin.Context) {
			userProxy.ServeHTTP(c.Writer, c.Request)
		})
	}

	// Event service routes
	r.Any("/events", func(c *gin.Context) {
		eventProxy.ServeHTTP(c.Writer, c.Request)
	})
	r.Any("/events/:id", func(c *gin.Context) {
		eventProxy.ServeHTTP(c.Writer, c.Request)
	})
	r.Any("/events/nearby", func(c *gin.Context) {
		eventProxy.ServeHTTP(c.Writer, c.Request)
	})
	r.Any("/events/upcoming", func(c *gin.Context) {
		eventProxy.ServeHTTP(c.Writer, c.Request)
	})

	// Protected event routes
	authorized.Any("/events/:id/register", func(c *gin.Context) {
		eventProxy.ServeHTTP(c.Writer, c.Request)
	})
	authorized.Any("/events/:id/unregister", func(c *gin.Context) {
		eventProxy.ServeHTTP(c.Writer, c.Request)
	})
	authorized.Any("/events/:id/attendees", func(c *gin.Context) {
		eventProxy.ServeHTTP(c.Writer, c.Request)
	})
	authorized.Any("/events/user", func(c *gin.Context) {
		eventProxy.ServeHTTP(c.Writer, c.Request)
	})

	// Message service routes
	r.Any("/messages", func(c *gin.Context) {
		messageProxy.ServeHTTP(c.Writer, c.Request)
	})
	r.Any("/messages/group/:group_id", func(c *gin.Context) {
		messageProxy.ServeHTTP(c.Writer, c.Request)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = cfg.Port
	}
	log.Printf("API Gateway starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
