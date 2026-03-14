package models

import (
	"testing"
	"time"
)

func TestUser_ToResponse(t *testing.T) {
	tests := []struct {
		name     string
		user     User
		expected UserResponse
	}{
		{
			name: "full user data",
			user: User{
				ID:          1,
				Email:       "test@example.com",
				Username:    "testuser",
				FirstName:   "John",
				LastName:    "Doe",
				Bio:         "Hello world",
				AvatarURL:   "https://example.com/avatar.jpg",
				Age:         25,
				IsOrganizer: true,
			},
			expected: UserResponse{
				ID:          1,
				Email:       "test@example.com",
				Username:    "testuser",
				FirstName:   "John",
				LastName:    "Doe",
				Bio:         "Hello world",
				AvatarURL:   "https://example.com/avatar.jpg",
				Age:         25,
				IsOrganizer: true,
			},
		},
		{
			name: "minimal user data",
			user: User{
				ID:        2,
				Email:     "min@example.com",
				Username:  "minuser",
				FirstName: "Jane",
				LastName:  "Smith",
				Age:       18,
			},
			expected: UserResponse{
				ID:          2,
				Email:       "min@example.com",
				Username:    "minuser",
				FirstName:   "Jane",
				LastName:    "Smith",
				Bio:         "",
				AvatarURL:   "",
				Age:         18,
				IsOrganizer: false,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.user.ToResponse()
			if result.ID != tt.expected.ID {
				t.Errorf("ID: expected %d, got %d", tt.expected.ID, result.ID)
			}
			if result.Email != tt.expected.Email {
				t.Errorf("Email: expected %s, got %s", tt.expected.Email, result.Email)
			}
			if result.Username != tt.expected.Username {
				t.Errorf("Username: expected %s, got %s", tt.expected.Username, result.Username)
			}
			if result.FirstName != tt.expected.FirstName {
				t.Errorf("FirstName: expected %s, got %s", tt.expected.FirstName, result.FirstName)
			}
			if result.LastName != tt.expected.LastName {
				t.Errorf("LastName: expected %s, got %s", tt.expected.LastName, result.LastName)
			}
			if result.Bio != tt.expected.Bio {
				t.Errorf("Bio: expected %s, got %s", tt.expected.Bio, result.Bio)
			}
			if result.AvatarURL != tt.expected.AvatarURL {
				t.Errorf("AvatarURL: expected %s, got %s", tt.expected.AvatarURL, result.AvatarURL)
			}
			if result.Age != tt.expected.Age {
				t.Errorf("Age: expected %d, got %d", tt.expected.Age, result.Age)
			}
			if result.IsOrganizer != tt.expected.IsOrganizer {
				t.Errorf("IsOrganizer: expected %v, got %v", tt.expected.IsOrganizer, result.IsOrganizer)
			}
		})
	}
}

func TestUser_Structure(t *testing.T) {
	user := User{
		ID:           1,
		Email:        "test@example.com",
		Username:     "testuser",
		PasswordHash: "hashed_password",
		FirstName:    "John",
		LastName:     "Doe",
		Bio:          "Test bio",
		AvatarURL:    "http://example.com/avatar.png",
		Age:          25,
		IsOrganizer:  true,
	}

	if user.ID != 1 {
		t.Errorf("Expected ID 1, got %d", user.ID)
	}
	if user.Email != "test@example.com" {
		t.Errorf("Expected Email test@example.com, got %s", user.Email)
	}
	if user.Username != "testuser" {
		t.Errorf("Expected Username testuser, got %s", user.Username)
	}
	if user.PasswordHash != "hashed_password" {
		t.Errorf("Expected PasswordHash hashed_password, got %s", user.PasswordHash)
	}
	if user.FirstName != "John" {
		t.Errorf("Expected FirstName John, got %s", user.FirstName)
	}
	if user.LastName != "Doe" {
		t.Errorf("Expected LastName Doe, got %s", user.LastName)
	}
	if user.Bio != "Test bio" {
		t.Errorf("Expected Bio Test bio, got %s", user.Bio)
	}
	if user.AvatarURL != "http://example.com/avatar.png" {
		t.Errorf("Expected AvatarURL http://example.com/avatar.png, got %s", user.AvatarURL)
	}
	if user.Age != 25 {
		t.Errorf("Expected Age 25, got %d", user.Age)
	}
	if !user.IsOrganizer {
		t.Error("Expected IsOrganizer to be true")
	}
}

func TestUser_Timestamps(t *testing.T) {
	now := time.Now()
	user := User{
		ID:        1,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if user.CreatedAt.IsZero() {
		t.Error("Expected CreatedAt to be set")
	}
	if user.UpdatedAt.IsZero() {
		t.Error("Expected UpdatedAt to be set")
	}
}
