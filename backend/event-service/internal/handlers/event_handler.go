package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/meetup/backend/event-service/internal/services"
	"net/http"
	"strconv"
)

// EventHandler handles event-related HTTP requests
type EventHandler struct {
	eventService *services.EventService
}

// NewEventHandler creates a new EventHandler with the given service
func NewEventHandler(eventService *services.EventService) *EventHandler {
	return &EventHandler{
		eventService: eventService,
	}
}

// CreateEvent godoc
// @Summary Create new event
// @Description Create a new event with title, description, date, location and other details
// @Tags Events
// @Accept json
// @Produce json
// @Param event body services.CreateEventInput true "Event data"
// @Success 201 {object} map[string]interface{}
// @Router /events [post]
func (h *EventHandler) CreateEvent(c *gin.Context) {
	userID := c.GetUint("user_id")
	var input services.CreateEventInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	event, err := h.eventService.CreateEvent(userID, input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "event created successfully",
		"event":   event,
	})
}

// GetEvent godoc
// @Summary Get event by ID
// @Description Get an event by its ID
// @Tags Events
// @Produce json
// @Param id path int true "Event ID"
// @Success 200 {object} models.Event
// @Router /events/{id} [get]
func (h *EventHandler) GetEvent(c *gin.Context) {
	eventID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event ID"})
		return
	}

	event, err := h.eventService.GetEventByID(uint(eventID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "event not found"})
		return
	}

	c.JSON(http.StatusOK, event)
}

// UpdateEvent godoc
// @Summary Update event
// @Description Update an event by its ID
// @Tags Events
// @Accept json
// @Produce json
// @Param id path int true "Event ID"
// @Param event body services.UpdateEventInput true "Event data"
// @Success 200 {object} models.Event
// @Router /events/{id} [put]
func (h *EventHandler) UpdateEvent(c *gin.Context) {
	eventID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event ID"})
		return
	}

	var input services.UpdateEventInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	event, err := h.eventService.UpdateEvent(uint(eventID), input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, event)
}

// DeleteEvent godoc
// @Summary Delete event
// @Description Delete an event by its ID
// @Tags Events
// @Param id path int true "Event ID"
// @Success 200 {object} map[string]string
// @Router /events/{id} [delete]
func (h *EventHandler) DeleteEvent(c *gin.Context) {
	eventID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event ID"})
		return
	}

	if err := h.eventService.DeleteEvent(uint(eventID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "event deleted"})
}

// GetEventsByLocation godoc
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
func (h *EventHandler) GetEventsByLocation(c *gin.Context) {
	latitude, err := strconv.ParseFloat(c.Query("latitude"), 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid latitude"})
		return
	}

	longitude, err := strconv.ParseFloat(c.Query("longitude"), 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid longitude"})
		return
	}

	radius := 10.0 // default radius in km
	if r := c.Query("radius"); r != "" {
		if parsed, err := strconv.ParseFloat(r, 64); err == nil {
			radius = parsed
		}
	}

	limit := 20 // default limit
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	events, err := h.eventService.GetEventsByLocation(latitude, longitude, radius, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, events)
}

// GetUpcomingEvents godoc
// @Summary Get upcoming events
// @Description Get upcoming events ordered by date
// @Tags Events
// @Produce json
// @Param limit query int false "Results limit (default 10)"
// @Success 200 {array} models.Event
// @Router /events/upcoming [get]
func (h *EventHandler) GetUpcomingEvents(c *gin.Context) {
	limit := 10 // default limit
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	events, err := h.eventService.GetUpcomingEvents(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, events)
}

// RegisterForEvent godoc
// @Summary Register for event
// @Description Register the current user for an event
// @Tags Events
// @Accept json
// @Produce json
// @Param id path int true "Event ID"
// @Success 200 {object} map[string]string
// @Router /events/{id}/register [post]
func (h *EventHandler) RegisterForEvent(c *gin.Context) {
	eventID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event ID"})
		return
	}

	userID := c.GetUint("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	if err := h.eventService.RegisterForEvent(userID, uint(eventID)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "registered for event"})
}

// UnregisterFromEvent godoc
// @Summary Unregister from event
// @Description Unregister the current user from an event
// @Tags Events
// @Accept json
// @Produce json
// @Param id path int true "Event ID"
// @Success 200 {object} map[string]string
// @Router /events/{id}/unregister [delete]
func (h *EventHandler) UnregisterFromEvent(c *gin.Context) {
	eventID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event ID"})
		return
	}

	userID := c.GetUint("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	if err := h.eventService.UnregisterFromEvent(userID, uint(eventID)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "unregistered from event"})
}

// GetEventAttendees godoc
// @Summary Get event attendees
// @Description Get all attendees for a specific event
// @Tags Events
// @Produce json
// @Param id path int true "Event ID"
// @Success 200 {array} models.EventAttendee
// @Router /events/{id}/attendees [get]
func (h *EventHandler) GetEventAttendees(c *gin.Context) {
	eventID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event ID"})
		return
	}

	attendees, err := h.eventService.GetEventAttendees(uint(eventID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, attendees)
}

// GetUserEvents godoc
// @Summary Get user events
// @Description Get all events the current user is attending or organizing
// @Tags Events
// @Produce json
// @Param limit query int false "Results limit (default 10)"
// @Success 200 {array} models.Event
// @Router /events/user [get]
func (h *EventHandler) GetUserEvents(c *gin.Context) {
	userID := c.GetUint("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	limit := 10 // default limit
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	events, err := h.eventService.GetUserEvents(userID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, events)
}

// GetEvents godoc
// @Summary Get events
// @Description Get a list of events with pagination
// @Tags Events
// @Produce json
// @Param limit query int false "Results limit (default 20)"
// @Param offset query int false "Results offset (default 0)"
// @Success 200 {array} models.Event
// @Router /events [get]
func (h *EventHandler) GetEvents(c *gin.Context) {
	limit := 20 // default limit
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	offset := 0 // default offset
	if o := c.Query("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil {
			offset = parsed
		}
	}

	events, err := h.eventService.GetEvents(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, events)
}

// GetPendingAttendees godoc
// @Summary Get pending attendees for an event
// @Description Get list of users who applied to attend an event (for event organizers)
// @Tags Events
// @Produce json
// @Param id path int true "Event ID"
// @Success 200 {array} models.EventAttendee
// @Router /events/{id}/pending [get]
func (h *EventHandler) GetPendingAttendees(c *gin.Context) {
	userID := c.GetUint("user_id") // From auth middleware
	eventID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event ID"})
		return
	}

	attendees, err := h.eventService.GetPendingAttendees(uint(eventID), userID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, attendees)
}

// AcceptAttendee godoc
// @Summary Accept an attendee's application
// @Description Accept a user's application to attend an event
// @Tags Events
// @Produce json
// @Param id path int true "Event ID"
// @Param attendeeId path int true "Attendee ID"
// @Success 200 {object} map[string]string
// @Router /events/{id}/attendees/{attendeeId}/accept [put]
func (h *EventHandler) AcceptAttendee(c *gin.Context) {
	userID := c.GetUint("user_id")
	eventID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event ID"})
		return
	}

	attendeeID, err := strconv.ParseUint(c.Param("attendeeId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid attendee ID"})
		return
	}

	err = h.eventService.AcceptAttendee(uint(eventID), uint(attendeeID), userID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "attendee accepted"})
}

// RejectAttendee godoc
// @Summary Reject an attendee's application
// @Description Reject a user's application to attend an event
// @Tags Events
// @Produce json
// @Param id path int true "Event ID"
// @Param attendeeId path int true "Attendee ID"
// @Success 200 {object} map[string]string
// @Router /events/{id}/attendees/{attendeeId}/reject [put]
func (h *EventHandler) RejectAttendee(c *gin.Context) {
	userID := c.GetUint("user_id")
	eventID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event ID"})
		return
	}

	attendeeID, err := strconv.ParseUint(c.Param("attendeeId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid attendee ID"})
		return
	}

	err = h.eventService.RejectAttendee(uint(eventID), uint(attendeeID), userID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "attendee rejected"})
}

// CancelAttendance godoc
// @Summary Cancel attendance for an event
// @Description Cancel user's attendance for an event
// @Tags Events
// @Produce json
// @Param id path int true "Event ID"
// @Success 200 {object} map[string]string
// @Router /events/{id}/cancel [delete]
func (h *EventHandler) CancelAttendance(c *gin.Context) {
	userID := c.GetUint("user_id")
	eventID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event ID"})
		return
	}

	err = h.eventService.CancelAttendance(uint(eventID), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "attendance cancelled"})
}

// SearchEvents godoc
// @Summary Search events by text query
// @Description Search events by title or description
// @Tags Events
// @Produce json
// @Param q query string true "Search query"
// @Param limit query int false "Results limit"
// @Success 200 {array} models.Event
// @Router /events/search [get]
func (h *EventHandler) SearchEvents(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "search query is required"})
		return
	}

	limit := 20 // default limit
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	events, err := h.eventService.SearchEvents(query, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, events)
}

// GetOrganizedEvents godoc
// @Summary Get events organized by the current user
// @Description Get list of events organized by the current user (admin panel)
// @Tags Events
// @Produce json
// @Param limit query int false "Results limit"
// @Param offset query int false "Results offset"
// @Success 200 {array} models.Event
// @Router /events/organized [get]
func (h *EventHandler) GetOrganizedEvents(c *gin.Context) {
	userID := c.GetUint("user_id")

	limit := 20 // default limit
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	offset := 0 // default offset
	if o := c.Query("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil {
			offset = parsed
		}
	}

	events, err := h.eventService.GetOrganizedEvents(userID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, events)
}
