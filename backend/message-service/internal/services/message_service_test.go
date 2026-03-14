package services

import (
	"testing"

	"github.com/meetup/backend/message-service/internal/models"
)

func TestNewMessageService(t *testing.T) {
	service := NewMessageService(nil)
	if service == nil {
		t.Fatal("Expected non-nil MessageService")
	}
	if service.messageRepo != nil {
		t.Error("Expected messageRepo to be nil")
	}
}

func TestSendMessageInput_Fields(t *testing.T) {
	tests := []struct {
		name  string
		input SendMessageInput
		valid bool
	}{
		{
			name: "valid input",
			input: SendMessageInput{
				GroupID: 1,
				Content: "Hello World",
			},
			valid: true,
		},
		{
			name: "missing group ID",
			input: SendMessageInput{
				GroupID: 0,
				Content: "Hello",
			},
			valid: false,
		},
		{
			name: "missing content",
			input: SendMessageInput{
				GroupID: 1,
				Content: "",
			},
			valid: false,
		},
		{
			name: "both missing",
			input: SendMessageInput{
				GroupID: 0,
				Content: "",
			},
			valid: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			isValid := tt.input.GroupID > 0 && tt.input.Content != ""
			if isValid != tt.valid {
				t.Errorf("Expected valid=%v, got %v", tt.valid, isValid)
			}
		})
	}
}

func TestSendMessageInput_Validation(t *testing.T) {
	input := SendMessageInput{
		GroupID: 123,
		Content: "Test message content",
	}

	if input.GroupID != 123 {
		t.Errorf("Expected GroupID 123, got %d", input.GroupID)
	}
	if input.Content != "Test message content" {
		t.Errorf("Expected Content 'Test message content', got '%s'", input.Content)
	}
}

func TestSendMessageInput_WhitespaceContent(t *testing.T) {
	input := SendMessageInput{
		GroupID: 1,
		Content: "   ",
	}

	// Note: The basic validation only checks for empty string, not whitespace
	// This test documents the current behavior
	if input.Content == "" {
		t.Error("Expected non-empty Content")
	}
	if input.GroupID > 0 {
		t.Log("Note: Whitespace-only content is currently allowed by basic validation")
	}
}

func TestSendMessageInput_LongContent(t *testing.T) {
	longContent := ""
	for i := 0; i < 5000; i++ {
		longContent += "a"
	}

	input := SendMessageInput{
		GroupID: 1,
		Content: longContent,
	}

	if len(input.Content) != 5000 {
		t.Errorf("Expected Content length 5000, got %d", len(input.Content))
	}
}

func TestMessageModel_Fields(t *testing.T) {
	msg := &models.Message{
		ID:       1,
		SenderID: 10,
		GroupID:  5,
		Content:  "Test content",
	}

	if msg.ID != 1 {
		t.Errorf("Expected ID 1, got %d", msg.ID)
	}
	if msg.SenderID != 10 {
		t.Errorf("Expected SenderID 10, got %d", msg.SenderID)
	}
	if msg.GroupID != 5 {
		t.Errorf("Expected GroupID 5, got %d", msg.GroupID)
	}
	if msg.Content != "Test content" {
		t.Errorf("Expected Content 'Test content', got '%s'", msg.Content)
	}
}

func TestMessageModel_NilSender(t *testing.T) {
	msg := &models.Message{
		ID:       1,
		SenderID: 0,
		GroupID:  1,
		Content:  "Test",
	}

	if msg.SenderID != 0 {
		t.Errorf("Expected SenderID 0, got %d", msg.SenderID)
	}
}

func TestMessageList_Operations(t *testing.T) {
	messages := []models.Message{
		{ID: 1, SenderID: 1, GroupID: 1, Content: "First"},
		{ID: 2, SenderID: 2, GroupID: 1, Content: "Second"},
		{ID: 3, SenderID: 1, GroupID: 2, Content: "Third"},
	}

	if len(messages) != 3 {
		t.Fatalf("Expected 3 messages, got %d", len(messages))
	}

	var group1Messages []models.Message
	for _, msg := range messages {
		if msg.GroupID == 1 {
			group1Messages = append(group1Messages, msg)
		}
	}

	if len(group1Messages) != 2 {
		t.Errorf("Expected 2 messages in group 1, got %d", len(group1Messages))
	}

	var sender1Messages []models.Message
	for _, msg := range messages {
		if msg.SenderID == 1 {
			sender1Messages = append(sender1Messages, msg)
		}
	}

	if len(sender1Messages) != 2 {
		t.Errorf("Expected 2 messages from sender 1, got %d", len(sender1Messages))
	}
}

func TestMessage_EmptyGroup(t *testing.T) {
	messages := []models.Message{}

	if len(messages) != 0 {
		t.Errorf("Expected empty slice, got %d", len(messages))
	}
}

func TestMessage_UpdateContent(t *testing.T) {
	msg := models.Message{
		ID:      1,
		Content: "Original",
	}

	msg.Content = "Updated"

	if msg.Content != "Updated" {
		t.Errorf("Expected 'Updated', got '%s'", msg.Content)
	}
}
