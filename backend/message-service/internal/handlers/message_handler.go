package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/meetup/backend/message-service/internal/services"
	"net/http"
	"strconv"
)

// MessageHandler handles message-related HTTP requests
type MessageHandler struct {
	messageService *services.MessageService
}

// NewMessageHandler creates a new MessageHandler with the given service
func NewMessageHandler(messageService *services.MessageService) *MessageHandler {
	return &MessageHandler{
		messageService: messageService,
	}
}

// SendMessage godoc
// @Summary Send a message
// @Description Send a message to an event group
// @Tags Messages
// @Accept json
// @Produce json
// @Param message body services.SendMessageInput true "Message data"
// @Success 201 {object} map[string]interface{}
// @Router /messages [post]
func (h *MessageHandler) SendMessage(c *gin.Context) {
	var input services.SendMessageInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	senderID := c.GetUint("user_id")
	if senderID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	message, err := h.messageService.SendMessage(senderID, input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": message,
	})
}

// GetMessagesByGroup godoc
// @Summary Get messages by group ID
// @Description Get all messages for a specific event group
// @Tags Messages
// @Produce json
// @Param group_id path int true "Group ID"
// @Param limit query int false "Results limit (default 50)"
// @Success 200 {array} models.Message
// @Router /messages/group/{group_id} [get]
func (h *MessageHandler) GetMessagesByGroup(c *gin.Context) {
	groupID, err := strconv.ParseUint(c.Param("group_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid group ID"})
		return
	}

	limit := 50 // default limit
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	messages, err := h.messageService.GetMessagesByGroupID(uint(groupID), limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, messages)
}
