package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/meetup/backend/message-service/internal/config"
	"github.com/meetup/backend/message-service/internal/handlers"
	"github.com/meetup/backend/message-service/internal/middleware"
	"github.com/meetup/backend/message-service/internal/models"
	"github.com/meetup/backend/message-service/internal/repository"
	"github.com/meetup/backend/message-service/internal/services"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// @title Message Service API
// @version 1.0
// @description API for Message service in Meetup social networking application
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.example.com/support
// @contact.email support@example.com

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host localhost:8083
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
		&models.Message{},
		&models.EventGroup{},
	); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	messageRepo := repository.NewMessageRepository(db)
	messageService := services.NewMessageService(messageRepo)
	messageHandler := handlers.NewMessageHandler(messageService)

	r := gin.Default()

	r.Use(middleware.CORS())

	// Swagger docs
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Public routes
	// @Summary Send a message
	// @Description Send a message to an event group
	// @Tags Messages
	// @Accept json
	// @Produce json
	// @Param message body services.SendMessageInput true "Message data"
	// @Success 201 {object} map[string]interface{}
	// @Router /messages [post]
	r.POST("/messages", messageHandler.SendMessage)

	// @Summary Get messages by group ID
	// @Description Get all messages for a specific event group
	// @Tags Messages
	// @Produce json
	// @Param group_id path int true "Group ID"
	// @Param limit query int false "Results limit (default 50)"
	// @Success 200 {array} models.Message
	// @Router /messages/group/{group_id} [get]
	r.GET("/messages/group/:group_id", messageHandler.GetMessagesByGroup)

	// Protected routes (if needed in future)
	// authorized := r.Group("/")
	// authorized.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	// {
	//     // Add protected routes here
	// }

	port := os.Getenv("PORT")
	if port == "" {
		port = cfg.Port
	}
	r.Run(":" + port)
}
