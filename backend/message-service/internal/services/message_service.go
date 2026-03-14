package services

import (
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
	message := &models.Message{
		SenderID: senderID,
		GroupID:  input.GroupID,
		Content:  input.Content,
	}

	if err := s.messageRepo.Create(message); err != nil {
		return nil, err
	}

	return message, nil
}

func (s *MessageService) GetMessagesByGroupID(groupID uint, limit int) ([]models.Message, error) {
	messages, err := s.messageRepo.FindByGroupID(groupID)
	if err != nil {
		return nil, err
	}

	// Apply limit if specified
	if limit > 0 && len(messages) > limit {
		if len(messages) > limit {
			messages = messages[len(messages)-limit:]
		}
	}

	return messages, nil
}
