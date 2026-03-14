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

func (s *EventService) CreateEvent(input CreateEventInput) (*models.Event, error) {
	eventDate, err := time.Parse(time.RFC3339, input.EventDate)
	if err != nil {
		return nil, errors.New("invalid date format, expected ISO 8601")
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
		OrganizerID:  1, // TODO: Get from auth context
	}

	if err := s.eventRepo.Create(event); err != nil {
		return nil, err
	}

	return event, nil
}

func (s *EventService) GetEventByID(id uint) (*models.Event, error) {
	return s.eventRepo.FindByID(id)
}

func (s *EventService) UpdateEvent(id uint, input UpdateEventInput) (*models.Event, error) {
	event, err := s.eventRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	if input.Title != nil {
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
		event.Latitude = *input.Latitude
	}
	if input.Longitude != nil {
		event.Longitude = *input.Longitude
	}
	if input.Address != nil {
		event.Address = *input.Address
	}
	if input.IsFree != nil {
		event.IsFree = *input.IsFree
	}
	if input.Price != nil {
		event.Price = *input.Price
	}
	if input.Category != nil {
		event.Category = *input.Category
	}
	if input.MaxAttendees != nil {
		event.MaxAttendees = *input.MaxAttendees
	}

	if err := s.eventRepo.Update(event); err != nil {
		return nil, err
	}

	return event, nil
}

func (s *EventService) DeleteEvent(id uint) error {
	return s.eventRepo.Delete(id)
}

func (s *EventService) GetEventsByLocation(latitude, longitude float64, radiusKm float64, limit int) ([]models.Event, error) {
	return s.eventRepo.GetEventsByLocation(latitude, longitude, radiusKm, limit)
}

func (s *EventService) GetUpcomingEvents(limit int) ([]models.Event, error) {
	return s.eventRepo.GetUpcomingEvents(limit)
}

func (s *EventService) RegisterForEvent(userID uint, eventID uint) error {
	// Check if event exists
	_, err := s.eventRepo.FindByID(eventID)
	if err != nil {
		return err
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

	// Register for event
	attendee := &models.EventAttendee{
		UserID:  userID,
		EventID: eventID,
		Status:  "going",
	}

	return s.eventRepo.CreateAttendee(attendee)
}

func (s *EventService) UnregisterFromEvent(userID uint, eventID uint) error {
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
	return s.eventRepo.GetEventAttendees(eventID)
}

func (s *EventService) GetUserEvents(userID uint, limit int) ([]models.Event, error) {
	return s.eventRepo.GetUserEvents(userID)
}
