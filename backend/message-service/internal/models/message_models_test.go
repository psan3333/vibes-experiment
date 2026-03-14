package models

import (
	"testing"
	"time"
)

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

func TestMessage_Timestamps(t *testing.T) {
	now := time.Now()
	msg := Message{
		ID:        1,
		CreatedAt: now,
	}

	if msg.CreatedAt.IsZero() {
		t.Error("Expected CreatedAt to be set")
	}
}

func TestMessage_EmptyContent(t *testing.T) {
	msg := Message{
		ID:       1,
		SenderID: 1,
		GroupID:  1,
		Content:  "",
	}

	if msg.Content != "" {
		t.Errorf("Expected empty Content, got '%s'", msg.Content)
	}
}

func TestMessage_LongContent(t *testing.T) {
	longContent := ""
	for i := 0; i < 1000; i++ {
		longContent += "a"
	}

	msg := Message{
		ID:       1,
		SenderID: 1,
		GroupID:  1,
		Content:  longContent,
	}

	if len(msg.Content) != 1000 {
		t.Errorf("Expected Content length 1000, got %d", len(msg.Content))
	}
}

func TestMessage_UnicodeContent(t *testing.T) {
	msg := Message{
		ID:       1,
		SenderID: 1,
		GroupID:  1,
		Content:  "Привет мир! Hello World! 🌍",
	}

	if msg.Content != "Привет мир! Hello World! 🌍" {
		t.Errorf("Content mismatch")
	}
}

func TestMessage_MultipleMessages(t *testing.T) {
	messages := []Message{
		{ID: 1, SenderID: 1, GroupID: 1, Content: "First"},
		{ID: 2, SenderID: 2, GroupID: 1, Content: "Second"},
		{ID: 3, SenderID: 1, GroupID: 1, Content: "Third"},
	}

	if len(messages) != 3 {
		t.Errorf("Expected 3 messages, got %d", len(messages))
	}

	if messages[0].Content != "First" {
		t.Errorf("First message content mismatch")
	}
	if messages[1].Content != "Second" {
		t.Errorf("Second message content mismatch")
	}
	if messages[2].Content != "Third" {
		t.Errorf("Third message content mismatch")
	}
}
