package repository

import (
	"time"

	"github.com/meetup/backend/event-service/internal/models"
	"gorm.io/gorm"
)

type EventRepository struct {
	db *gorm.DB
}

func NewEventRepository(db *gorm.DB) *EventRepository {
	return &EventRepository{db: db}
}

func (r *EventRepository) Create(event *models.Event) error {
	return r.db.Create(event).Error
}

func (r *EventRepository) FindByID(id uint) (*models.Event, error) {
	var event models.Event
	err := r.db.First(&event, id).Error
	if err != nil {
		return nil, err
	}
	return &event, nil
}

func (r *EventRepository) FindByOrganizerID(organizerID uint) ([]models.Event, error) {
	var events []models.Event
	err := r.db.Where("organizer_id = ?", organizerID).Find(&events).Error
	return events, err
}

func (r *EventRepository) Update(event *models.Event) error {
	return r.db.Save(event).Error
}

func (r *EventRepository) Delete(id uint) error {
	return r.db.Delete(&models.Event{}, id).Error
}

func (r *EventRepository) GetEventsByLocation(latitude, longitude float64, radiusKm float64, limit int) ([]models.Event, error) {
	var events []models.Event
	// Simple distance calculation using Haversine formula approximation
	// For more accurate results, consider using PostGIS or similar
	err := r.db.Where("ABS(latitude - ?) < ? AND ABS(longitude - ?) < ?",
		latitude, radiusKm/111.0, longitude, radiusKm/111.0).
		Limit(limit).
		Find(&events).Error
	return events, err
}

func (r *EventRepository) GetUpcomingEvents(limit int) ([]models.Event, error) {
	var events []models.Event
	err := r.db.Where("event_date > ?", time.Now()).
		Order("event_date ASC").
		Limit(limit).
		Find(&events).Error
	return events, err
}

func (r *EventRepository) CreateAttendee(attendee *models.EventAttendee) error {
	return r.db.Create(attendee).Error
}

func (r *EventRepository) GetEventAttendees(eventID uint) ([]models.EventAttendee, error) {
	var attendees []models.EventAttendee
	err := r.db.Where("event_id = ?", eventID).Find(&attendees).Error
	return attendees, err
}

func (r *EventRepository) UpdateAttendeeStatus(attendeeID uint, status string) error {
	return r.db.Model(&models.EventAttendee{}).Where("id = ?", attendeeID).Update("status", status).Error
}

func (r *EventRepository) GetUserEvents(userID uint) ([]models.Event, error) {
	var events []models.Event
	err := r.db.Joins("JOIN event_attendees ON event_attendees.event_id = events.id").
		Where("event_attendees.user_id = ?", userID).
		Find(&events).Error
	return events, err
}
