package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID           uint           `gorm:"primarykey" json:"id"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
	Email        string         `gorm:"uniqueIndex;not null" json:"email"`
	Username     string         `gorm:"uniqueIndex;not null" json:"username"`
	PasswordHash string         `gorm:"not null" json:"-"`
	FirstName    string         `json:"first_name"`
	LastName     string         `json:"last_name"`
	Bio          string         `json:"bio"`
	AvatarURL    string         `json:"avatar_url"`
	Age          int            `gorm:"not null" json:"age"`
	IsOrganizer  bool           `gorm:"default:false" json:"is_organizer"`
}

type Event struct {
	ID           uint           `gorm:"primarykey" json:"id"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
	Title        string         `gorm:"not null" json:"title"`
	Description  string         `json:"description"`
	EventDate    time.Time      `gorm:"not null" json:"event_date"`
	Latitude     float64        `gorm:"not null" json:"latitude"`
	Longitude    float64        `gorm:"not null" json:"longitude"`
	Address      string         `json:"address"`
	IsFree       bool           `gorm:"default:true" json:"is_free"`
	Price        float64        `json:"price"`
	OrganizerID  uint           `gorm:"not null" json:"organizer_id"`
	Organizer    *User          `gorm:"foreignKey:OrganizerID" json:"organizer,omitempty"`
	Category     string         `json:"category"`
	MaxAttendees int            `json:"max_attendees"`
}

type EventAttendee struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UserID    uint      `gorm:"not null;index" json:"user_id"`
	EventID   uint      `gorm:"not null;index" json:"event_id"`
	Status    string    `gorm:"default:'going'" json:"status"`
	User      *User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Event     *Event    `gorm:"foreignKey:EventID" json:"event,omitempty"`
}

type Message struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	SenderID  uint      `gorm:"not null;index" json:"sender_id"`
	GroupID   uint      `gorm:"not null;index" json:"group_id"`
	Content   string    `gorm:"not null" json:"content"`
	Sender    *User     `gorm:"foreignKey:SenderID" json:"sender,omitempty"`
}

type EventGroup struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	EventID   uint      `gorm:"uniqueIndex;not null" json:"event_id"`
	Event     *Event    `gorm:"foreignKey:EventID" json:"event,omitempty"`
}

type FriendRequest struct {
	ID         uint      `gorm:"primarykey" json:"id"`
	CreatedAt  time.Time `json:"created_at"`
	SenderID   uint      `gorm:"not null;index" json:"sender_id"`
	ReceiverID uint      `gorm:"not null;index" json:"receiver_id"`
	Status     string    `gorm:"default:'pending'" json:"status"`
	Sender     *User     `gorm:"foreignKey:SenderID" json:"sender,omitempty"`
	Receiver   *User     `gorm:"foreignKey:ReceiverID" json:"receiver,omitempty"`
}

type Friendship struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UserID    uint      `gorm:"not null;index" json:"user_id"`
	FriendID  uint      `gorm:"not null;index" json:"friend_id"`
	User      *User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Friend    *User     `gorm:"foreignKey:FriendID" json:"friend,omitempty"`
}

type UserResponse struct {
	ID          uint   `json:"id"`
	Email       string `json:"email"`
	Username    string `json:"username"`
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	Bio         string `json:"bio"`
	AvatarURL   string `json:"avatar_url"`
	Age         int    `json:"age"`
	IsOrganizer bool   `json:"is_organizer"`
}

func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:          u.ID,
		Email:       u.Email,
		Username:    u.Username,
		FirstName:   u.FirstName,
		LastName:    u.LastName,
		Bio:         u.Bio,
		AvatarURL:   u.AvatarURL,
		Age:         u.Age,
		IsOrganizer: u.IsOrganizer,
	}
}
