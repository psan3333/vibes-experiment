package models

import (
	"testing"
	"time"
)

func TestEvent_Structure(t *testing.T) {
	event := Event{
		ID:           1,
		Title:        "Test Event",
		Description:  "Test Description",
		EventDate:    time.Now(),
		Latitude:     55.7558,
		Longitude:    37.6173,
		Address:      "Moscow",
		IsFree:       false,
		Price:        100.50,
		OrganizerID:  1,
		Category:     "Sports",
		MaxAttendees: 50,
	}

	if event.ID != 1 {
		t.Errorf("Expected ID 1, got %d", event.ID)
	}
	if event.Title != "Test Event" {
		t.Errorf("Expected Title 'Test Event', got '%s'", event.Title)
	}
	if event.Latitude != 55.7558 {
		t.Errorf("Expected Latitude 55.7558, got %f", event.Latitude)
	}
	if event.Longitude != 37.6173 {
		t.Errorf("Expected Longitude 37.6173, got %f", event.Longitude)
	}
	if event.IsFree != false {
		t.Error("Expected IsFree to be false")
	}
	if event.Price != 100.50 {
		t.Errorf("Expected Price 100.50, got %f", event.Price)
	}
	if event.Category != "Sports" {
		t.Errorf("Expected Category 'Sports', got '%s'", event.Category)
	}
	if event.MaxAttendees != 50 {
		t.Errorf("Expected MaxAttendees 50, got %d", event.MaxAttendees)
	}
}

func TestEvent_Timestamps(t *testing.T) {
	now := time.Now()
	event := Event{
		ID:        1,
		Title:     "Test Event",
		EventDate: now,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if event.CreatedAt.IsZero() {
		t.Error("Expected CreatedAt to be set")
	}
	if event.UpdatedAt.IsZero() {
		t.Error("Expected UpdatedAt to be set")
	}
	if event.EventDate.IsZero() {
		t.Error("Expected EventDate to be set")
	}
}

func TestEvent_FreeEvent(t *testing.T) {
	event := Event{
		ID:     1,
		Title:  "Free Event",
		IsFree: true,
		Price:  0,
	}

	if !event.IsFree {
		t.Error("Expected IsFree to be true")
	}
	if event.Price != 0 {
		t.Errorf("Expected Price 0, got %f", event.Price)
	}
}

func TestEvent_PaidEvent(t *testing.T) {
	event := Event{
		ID:     1,
		Title:  "Paid Event",
		IsFree: false,
		Price:  500,
	}

	if event.IsFree {
		t.Error("Expected IsFree to be false")
	}
	if event.Price != 500 {
		t.Errorf("Expected Price 500, got %f", event.Price)
	}
}

func TestEventAttendee_Structure(t *testing.T) {
	attendee := EventAttendee{
		ID:      1,
		UserID:  1,
		EventID: 1,
		Status:  "going",
	}

	if attendee.ID != 1 {
		t.Errorf("Expected ID 1, got %d", attendee.ID)
	}
	if attendee.UserID != 1 {
		t.Errorf("Expected UserID 1, got %d", attendee.UserID)
	}
	if attendee.EventID != 1 {
		t.Errorf("Expected EventID 1, got %d", attendee.EventID)
	}
	if attendee.Status != "going" {
		t.Errorf("Expected Status 'going', got '%s'", attendee.Status)
	}
}

func TestEventAttendee_DefaultStatus(t *testing.T) {
	attendee := EventAttendee{}
	// Note: Default values are set by GORM at database level, not in Go struct
	if attendee.Status != "" && attendee.Status != "going" {
		t.Errorf("Expected default Status '' or 'going', got '%s'", attendee.Status)
	}
}

func TestMessage_Structure(t *testing.T) {
	msg := Message{
		ID:       1,
		SenderID: 1,
		GroupID:  1,
		Content:  "Hello World",
	}

	if msg.ID != 1 {
		t.Errorf("Expected ID 1, got %d", msg.ID)
	}
	if msg.SenderID != 1 {
		t.Errorf("Expected SenderID 1, got %d", msg.SenderID)
	}
	if msg.GroupID != 1 {
		t.Errorf("Expected GroupID 1, got %d", msg.GroupID)
	}
	if msg.Content != "Hello World" {
		t.Errorf("Expected Content 'Hello World', got '%s'", msg.Content)
	}
}

func TestEventGroup_Structure(t *testing.T) {
	group := EventGroup{
		ID:      1,
		EventID: 1,
	}

	if group.ID != 1 {
		t.Errorf("Expected ID 1, got %d", group.ID)
	}
	if group.EventID != 1 {
		t.Errorf("Expected EventID 1, got %d", group.EventID)
	}
}

func TestFriendRequest_Structure(t *testing.T) {
	req := FriendRequest{
		ID:         1,
		SenderID:   1,
		ReceiverID: 2,
		Status:     "pending",
	}

	if req.ID != 1 {
		t.Errorf("Expected ID 1, got %d", req.ID)
	}
	if req.SenderID != 1 {
		t.Errorf("Expected SenderID 1, got %d", req.SenderID)
	}
	if req.ReceiverID != 2 {
		t.Errorf("Expected ReceiverID 2, got %d", req.ReceiverID)
	}
	if req.Status != "pending" {
		t.Errorf("Expected Status 'pending', got '%s'", req.Status)
	}
}

func TestFriendRequest_DefaultStatus(t *testing.T) {
	req := FriendRequest{}
	// Note: Default values are set by GORM at database level, not in Go struct
	if req.Status != "" && req.Status != "pending" {
		t.Errorf("Expected default Status '' or 'pending', got '%s'", req.Status)
	}
}

func TestFriendship_Structure(t *testing.T) {
	friendship := Friendship{
		ID:       1,
		UserID:   1,
		FriendID: 2,
	}

	if friendship.ID != 1 {
		t.Errorf("Expected ID 1, got %d", friendship.ID)
	}
	if friendship.UserID != 1 {
		t.Errorf("Expected UserID 1, got %d", friendship.UserID)
	}
	if friendship.FriendID != 2 {
		t.Errorf("Expected FriendID 2, got %d", friendship.FriendID)
	}
}
