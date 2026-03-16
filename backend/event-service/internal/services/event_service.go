package services

import (
	"errors"
	"time"

	"github.com/meetup/backend/event-service/internal/models"
	"github.com/meetup/backend/event-service/internal/repository"
)

type EventService struct {
	eventRepo *repository.EventRepository
}

func NewEventService(eventRepo *repository.EventRepository) *EventService {
	return &EventService{eventRepo: eventRepo}
}

type CreateEventInput struct {
	Title        string  `json:"title" binding:"required"`
	Description  string  `json:"description"`
	EventDate    string  `json:"event_date" binding:"required"` // ISO 8601 format
	Latitude     float64 `json:"latitude" binding:"required"`
	Longitude    float64 `json:"longitude" binding:"required"`
	Address      string  `json:"address"`
	IsFree       bool    `json:"is_free" default:"true"`
	Price        float64 `json:"price"`
	Category     string  `json:"category"`
	MaxAttendees int     `json:"max_attendees"`
}

type UpdateEventInput struct {
	Title        *string  `json:"title"`
	Description  *string  `json:"description"`
	EventDate    *string  `json:"event_date"` // ISO 8601 format
	Latitude     *float64 `json:"latitude"`
	Longitude    *float64 `json:"longitude"`
	Address      *string  `json:"address"`
	IsFree       *bool    `json:"is_free"`
	Price        *float64 `json:"price"`
	Category     *string  `json:"category"`
	MaxAttendees *int     `json:"max_attendees"`
}

func (s *EventService) CreateEvent(userID uint, input CreateEventInput) (*models.Event, error) {
	if input.Latitude < -90 || input.Latitude > 90 {
		return nil, errors.New("latitude must be between -90 and 90")
	}

	// Validate longitude range (-180 to 180)
	if input.Longitude < -180 || input.Longitude > 180 {
		return nil, errors.New("longitude must be between -180 and 180")
	}

	// Parse and validate date
	eventDate, err := time.Parse(time.RFC3339, input.EventDate)
	if err != nil {
		return nil, errors.New("invalid date format, expected ISO 8601 (e.g., 2026-12-31T23:59:59Z)")
	}

	// Validate that event date is in the future
	if eventDate.Before(time.Now()) {
		return nil, errors.New("event date must be in the future")
	}

	// Validate price for non-free events
	if !input.IsFree && input.Price < 0 {
		return nil, errors.New("price must be non-negative for paid events")
	}

	// Validate max attendees
	if input.MaxAttendees < 0 {
		return nil, errors.New("max attendees must be non-negative")
	}

	event := &models.Event{
		Title:        input.Title,
		Description:  input.Description,
		EventDate:    eventDate,
		Latitude:     input.Latitude,
		Longitude:    input.Longitude,
		Address:      input.Address,
		IsFree:       input.IsFree,
		Price:        input.Price,
		Category:     input.Category,
		MaxAttendees: input.MaxAttendees,
		OrganizerID:  userID,
	}

	if err := s.eventRepo.Create(event); err != nil {
		return nil, err
	}

	return event, nil
}

func (s *EventService) GetEventByID(id uint) (*models.Event, error) {
	// Validate ID
	if id == 0 {
		return nil, errors.New("invalid event ID")
	}
	return s.eventRepo.FindByID(id)
}

func (s *EventService) UpdateEvent(id uint, input UpdateEventInput) (*models.Event, error) {
	// Validate ID
	if id == 0 {
		return nil, errors.New("invalid event ID")
	}

	event, err := s.eventRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	if input.Title != nil {
		if *input.Title == "" {
			return nil, errors.New("title cannot be empty")
		}
		event.Title = *input.Title
	}
	if input.Description != nil {
		event.Description = *input.Description
	}
	if input.EventDate != nil {
		eventDate, err := time.Parse(time.RFC3339, *input.EventDate)
		if err != nil {
			return nil, errors.New("invalid date format, expected ISO 8601")
		}
		event.EventDate = eventDate
	}
	if input.Latitude != nil {
		if *input.Latitude < -90 || *input.Latitude > 90 {
			return nil, errors.New("latitude must be between -90 and 90")
		}
		event.Latitude = *input.Latitude
	}
	if input.Longitude != nil {
		if *input.Longitude < -180 || *input.Longitude > 180 {
			return nil, errors.New("longitude must be between -180 and 180")
		}
		event.Longitude = *input.Longitude
	}
	if input.Address != nil {
		event.Address = *input.Address
	}
	if input.IsFree != nil {
		event.IsFree = *input.IsFree
	}
	if input.Price != nil {
		if *input.Price < 0 {
			return nil, errors.New("price must be non-negative")
		}
		event.Price = *input.Price
	}
	if input.Category != nil {
		event.Category = *input.Category
	}
	if input.MaxAttendees != nil {
		if *input.MaxAttendees < 0 {
			return nil, errors.New("max attendees must be non-negative")
		}
		event.MaxAttendees = *input.MaxAttendees
	}

	if err := s.eventRepo.Update(event); err != nil {
		return nil, err
	}

	return event, nil
}

func (s *EventService) DeleteEvent(id uint) error {
	// Validate ID
	if id == 0 {
		return errors.New("invalid event ID")
	}
	return s.eventRepo.Delete(id)
}

func (s *EventService) GetEventsByLocation(latitude, longitude float64, radiusKm float64, limit int) ([]models.Event, error) {
	// Validate latitude range
	if latitude < -90 || latitude > 90 {
		return nil, errors.New("latitude must be between -90 and 90")
	}

	// Validate longitude range
	if longitude < -180 || longitude > 180 {
		return nil, errors.New("longitude must be between -180 and 180")
	}

	// Validate radius
	if radiusKm < 0 {
		radiusKm = 10 // default
	}

	// Validate limit
	if limit < 0 {
		limit = 20 // default
	}

	return s.eventRepo.GetEventsByLocation(latitude, longitude, radiusKm, limit)
}

func (s *EventService) GetUpcomingEvents(limit int) ([]models.Event, error) {
	// Validate limit
	if limit < 0 {
		limit = 10 // default
	}
	return s.eventRepo.GetUpcomingEvents(limit)
}

func (s *EventService) RegisterForEvent(userID uint, eventID uint) error {
	// Validate IDs
	if userID == 0 {
		return errors.New("invalid user ID")
	}
	if eventID == 0 {
		return errors.New("invalid event ID")
	}

	// Check if event exists
	_, err := s.eventRepo.FindByID(eventID)
	if err != nil {
		return errors.New("event not found")
	}

	// Check if user is already registered
	attendees, err := s.eventRepo.GetEventAttendees(eventID)
	if err != nil {
		return err
	}

	for _, attendee := range attendees {
		if attendee.UserID == userID {
			return errors.New("already registered for this event")
		}
	}

	// Generate ticket ID
	ticketID, err := models.GenerateTicketID()
	if err != nil {
		return errors.New("failed to generate ticket ID")
	}

	// Register for event with pending status
	attendee := &models.EventAttendee{
		UserID:   userID,
		EventID:  eventID,
		Status:   "pending",
		TicketID: ticketID,
	}

	return s.eventRepo.CreateAttendee(attendee)
}

func (s *EventService) UnregisterFromEvent(userID uint, eventID uint) error {
	// Validate IDs
	if userID == 0 {
		return errors.New("invalid user ID")
	}
	if eventID == 0 {
		return errors.New("invalid event ID")
	}

	attendees, err := s.eventRepo.GetEventAttendees(eventID)
	if err != nil {
		return err
	}

	for _, attendee := range attendees {
		if attendee.UserID == userID {
			return s.eventRepo.UpdateAttendeeStatus(attendee.ID, "cancelled")
		}
	}

	return errors.New("not registered for this event")
}

func (s *EventService) GetEventAttendees(eventID uint) ([]models.EventAttendee, error) {
	// Validate ID
	if eventID == 0 {
		return nil, errors.New("invalid event ID")
	}
	return s.eventRepo.GetEventAttendees(eventID)
}

func (s *EventService) GetUserEvents(userID uint, limit int) ([]models.Event, error) {
	// Validate ID
	if userID == 0 {
		return nil, errors.New("invalid user ID")
	}

	// Validate limit
	if limit < 0 {
		limit = 10 // default
	}

	return s.eventRepo.GetUserEvents(userID)
}

func (s *EventService) GetEvents(limit, offset int) ([]models.Event, error) {
	// Validate limit
	if limit < 0 {
		limit = 20 // default
	}
	// Validate offset
	if offset < 0 {
		offset = 0
	}
	return s.eventRepo.GetEvents(limit, offset)
}

func (s *EventService) GetPendingAttendees(eventID uint, userID uint) ([]models.EventAttendee, error) {
	// Check if the user is the organizer of the event
	event, err := s.eventRepo.FindByID(eventID)
	if err != nil {
		return nil, errors.New("event not found")
	}
	if event.OrganizerID != userID {
		return nil, errors.New("not authorized to view pending attendees")
	}

	return s.eventRepo.GetPendingAttendees(eventID)
}

func (s *EventService) AcceptAttendee(eventID uint, attendeeID uint, userID uint) error {
	// Check if the user is the organizer of the event
	event, err := s.eventRepo.FindByID(eventID)
	if err != nil {
		return errors.New("event not found")
	}
	if event.OrganizerID != userID {
		return errors.New("not authorized to accept attendees")
	}

	return s.eventRepo.UpdateAttendeeStatus(attendeeID, "approved")
}

func (s *EventService) RejectAttendee(eventID uint, attendeeID uint, userID uint) error {
	// Check if the user is the organizer of the event
	event, err := s.eventRepo.FindByID(eventID)
	if err != nil {
		return errors.New("event not found")
	}
	if event.OrganizerID != userID {
		return errors.New("not authorized to reject attendees")
	}

	return s.eventRepo.UpdateAttendeeStatus(attendeeID, "rejected")
}

func (s *EventService) CancelAttendance(eventID uint, userID uint) error {
	return s.eventRepo.UpdateAttendeeStatusByEventAndUser(eventID, userID, "cancelled")
}

func (s *EventService) SearchEvents(query string, limit int) ([]models.Event, error) {
	// Validate limit
	if limit < 0 {
		limit = 20 // default
	}
	return s.eventRepo.SearchEvents(query, limit)
}

func (s *EventService) GetOrganizedEvents(userID uint, limit, offset int) ([]models.Event, error) {
	// Validate limit
	if limit < 0 {
		limit = 20 // default
	}
	// Validate offset
	if offset < 0 {
		offset = 0
	}
	return s.eventRepo.FindByOrganizerIDPaged(userID, limit, offset)
}
