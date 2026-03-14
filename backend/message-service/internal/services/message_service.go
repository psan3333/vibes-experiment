package services

import (
	"errors"
	"strings"

	"github.com/meetup/backend/message-service/internal/models"
	"github.com/meetup/backend/message-service/internal/repository"
)

type MessageService struct {
	messageRepo *repository.MessageRepository
}

func NewMessageService(messageRepo *repository.MessageRepository) *MessageService {
	return &MessageService{
		messageRepo: messageRepo,
	}
}

type SendMessageInput struct {
	GroupID uint   `json:"group_id" binding:"required"`
	Content string `json:"content" binding:"required"`
}

func (s *MessageService) SendMessage(senderID uint, input SendMessageInput) (*models.Message, error) {
	// Validate sender ID
	if senderID == 0 {
		return nil, errors.New("invalid sender ID")
	}

	// Validate group ID
	if input.GroupID == 0 {
		return nil, errors.New("invalid group ID")
	}

	// Validate content
	trimmedContent := strings.TrimSpace(input.Content)
	if trimmedContent == "" {
		return nil, errors.New("message content cannot be empty")
	}

	message := &models.Message{
		SenderID: senderID,
		GroupID:  input.GroupID,
		Content:  trimmedContent,
	}

	if err := s.messageRepo.Create(message); err != nil {
		return nil, err
	}

	return message, nil
}

func (s *MessageService) GetMessagesByGroupID(groupID uint, limit int) ([]models.Message, error) {
	// Validate group ID
	if groupID == 0 {
		return nil, errors.New("invalid group ID")
	}

	// Validate and set default limit
	if limit <= 0 {
		limit = 50
	}
	if limit > 100 {
		limit = 100 // Max limit
	}

	messages, err := s.messageRepo.FindByGroupID(groupID)
	if err != nil {
		return nil, err
	}

	// Apply limit if specified
	if len(messages) > limit {
		messages = messages[len(messages)-limit:]
	}

	return messages, nil
}
