package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/meetup/backend/event-service/internal/config"
	"github.com/meetup/backend/event-service/internal/handlers"
	"github.com/meetup/backend/event-service/internal/middleware"
	"github.com/meetup/backend/event-service/internal/models"
	"github.com/meetup/backend/event-service/internal/repository"
	"github.com/meetup/backend/event-service/internal/services"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// @title Event Service API
// @version 1.0
// @description API for Event service in Meetup social networking application
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.example.com/support
// @contact.email support@example.com

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host localhost:8082
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
		&models.Event{},
		&models.EventAttendee{},
	); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	eventRepo := repository.NewEventRepository(db)
	eventService := services.NewEventService(eventRepo)
	eventHandler := handlers.NewEventHandler(eventService)

	r := gin.Default()

	r.Use(middleware.CORS())

	// Swagger docs
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Public routes
	// @Summary Create new event
	// @Description Create a new event with title, description, date, location and other details
	// @Tags Events
	// @Accept json
	// @Produce json
	// @Param event body services.CreateEventInput true "Event data"
	// @Success 201 {object} map[string]interface{}
	// @Router /events [post]
	r.POST("/events", eventHandler.CreateEvent)

	// @Summary Get event by ID
	// @Description Get an event by its ID
	// @Tags Events
	// @Produce json
	// @Param id path int true "Event ID"
	// @Success 200 {object} models.Event
	// @Router /events/{id} [get]
	r.GET("/events/:id", eventHandler.GetEvent)

	// @Summary Update event
	// @Description Update an event by its ID
	// @Tags Events
	// @Accept json
	// @Produce json
	// @Param id path int true "Event ID"
	// @Param event body services.UpdateEventInput true "Event data"
	// @Success 200 {object} models.Event
	// @Router /events/{id} [put]
	r.PUT("/events/:id", eventHandler.UpdateEvent)

	// @Summary Delete event
	// @Description Delete an event by its ID
	// @Tags Events
	// @Param id path int true "Event ID"
	// @Success 200 {object} map[string]string
	// @Router /events/{id} [delete]
	r.DELETE("/events/:id", eventHandler.DeleteEvent)

	// @Summary Get events by location
	// @Description Get events near a specific latitude and longitude
	// @Tags Events
	// @Produce json
	// @Param latitude query float64 true "Latitude"
	// @Param longitude query float64 true "Longitude"
	// @Param radius query float64 false "Radius in kilometers (default 10)"
	// @Param limit query int false "Results limit (default 20)"
	// @Success 200 {array} models.Event
	// @Router /events/nearby [get]
	r.GET("/events/nearby", eventHandler.GetEventsByLocation)

	// @Summary Get upcoming events
	// @Description Get upcoming events ordered by date
	// @Tags Events
	// @Produce json
	// @Param limit query int false "Results limit (default 10)"
	// @Success 200 {array} models.Event
	// @Router /events/upcoming [get]
	r.GET("/events/upcoming", eventHandler.GetUpcomingEvents)

	// Protected routes
	authorized := r.Group("/")
	authorized.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	{
		// @Summary Register for event
		// @Description Register the current user for an event
		// @Tags Events
		// @Accept json
		// @Produce json
		// @Param id path int true "Event ID"
		// @Success 200 {object} map[string]string
		// @Router /events/{id}/register [post]
		authorized.POST("/events/:id/register", eventHandler.RegisterForEvent)

		// @Summary Unregister from event
		// @Description Unregister the current user from an event
		// @Tags Events
		// @Accept json
		// @Produce json
		// @Param id path int true "Event ID"
		// @Success 200 {object} map[string]string
		// @Router /events/{id}/unregister [delete]
		authorized.DELETE("/events/:id/unregister", eventHandler.UnregisterFromEvent)

		// @Summary Get event attendees
		// @Description Get all attendees for a specific event
		// @Tags Events
		// @Produce json
		// @Param id path int true "Event ID"
		// @Success 200 {array} models.EventAttendee
		// @Router /events/{id}/attendees [get]
		authorized.GET("/events/:id/attendees", eventHandler.GetEventAttendees)

		// @Summary Get user events
		// @Description Get all events the current user is attending or organizing
		// @Tags Events
		// @Produce json
		// @Param limit query int false "Results limit (default 10)"
		// @Success 200 {array} models.Event
		// @Router /events/user [get]
		authorized.GET("/events/user", eventHandler.GetUserEvents)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = cfg.Port
	}
	r.Run(":" + port)
}
