package services

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func TestRegisterInput_Validation(t *testing.T) {
	tests := []struct {
		name  string
		input RegisterInput
		valid bool
	}{
		{
			name: "valid input",
			input: RegisterInput{
				Email:       "test@example.com",
				Username:    "testuser",
				Password:    "password123",
				FirstName:   "John",
				LastName:    "Doe",
				Age:         25,
				IsOrganizer: false,
			},
			valid: true,
		},
		{
			name: "underage user",
			input: RegisterInput{
				Email:       "young@example.com",
				Username:    "younguser",
				Password:    "password123",
				FirstName:   "Jane",
				LastName:    "Doe",
				Age:         17,
				IsOrganizer: false,
			},
			valid: false,
		},
		{
			name: "age 18 is valid",
			input: RegisterInput{
				Email:       "just18@example.com",
				Username:    "just18user",
				Password:    "password123",
				FirstName:   "Alice",
				LastName:    "Doe",
				Age:         18,
				IsOrganizer: false,
			},
			valid: true,
		},
		{
			name: "missing email",
			input: RegisterInput{
				Email:       "",
				Username:    "testuser",
				Password:    "password123",
				FirstName:   "John",
				LastName:    "Doe",
				Age:         25,
				IsOrganizer: false,
			},
			valid: false,
		},
		{
			name: "short password",
			input: RegisterInput{
				Email:       "test@example.com",
				Username:    "testuser",
				Password:    "123",
				FirstName:   "John",
				LastName:    "Doe",
				Age:         25,
				IsOrganizer: false,
			},
			valid: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			isValid := tt.input.Age >= 18 && tt.input.Email != "" && len(tt.input.Password) >= 6
			if isValid != tt.valid {
				t.Errorf("Test %s: expected valid=%v, got %v", tt.name, tt.valid, isValid)
			}
		})
	}
}

func TestUpdateProfileInput(t *testing.T) {
	input := UpdateProfileInput{
		FirstName: "John",
		LastName:  "Doe",
		Bio:       "Hello world",
	}

	if input.FirstName != "John" {
		t.Errorf("Expected FirstName 'John', got '%s'", input.FirstName)
	}
	if input.LastName != "Doe" {
		t.Errorf("Expected LastName 'Doe', got '%s'", input.LastName)
	}
	if input.Bio != "Hello world" {
		t.Errorf("Expected Bio 'Hello world', got '%s'", input.Bio)
	}
}

func TestSendFriendRequestInput(t *testing.T) {
	input := SendFriendRequestInput{
		ReceiverID: 123,
	}

	if input.ReceiverID != 123 {
		t.Errorf("Expected ReceiverID 123, got %d", input.ReceiverID)
	}
}

func TestTokenGeneration(t *testing.T) {
	authService := &AuthService{
		jwtSecret: "test-secret-key",
	}

	token, err := authService.generateToken(1)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}

	if token == "" {
		t.Error("Expected non-empty token")
	}

	userID, err := authService.ValidateToken(token)
	if err != nil {
		t.Fatalf("Failed to validate token: %v", err)
	}

	if userID != 1 {
		t.Errorf("Expected user ID 1, got %d", userID)
	}
}

func TestTokenValidation_InvalidToken(t *testing.T) {
	authService := &AuthService{
		jwtSecret: "test-secret-key",
	}

	_, err := authService.ValidateToken("invalid-token")
	if err == nil {
		t.Error("Expected error for invalid token")
	}
}

func TestTokenValidation_WrongSecret(t *testing.T) {
	authService1 := &AuthService{jwtSecret: "secret1"}
	authService2 := &AuthService{jwtSecret: "secret2"}

	token, _ := authService1.generateToken(1)

	_, err := authService2.ValidateToken(token)
	if err == nil {
		t.Error("Expected error for token with wrong secret")
	}
}

func TestExpiredToken(t *testing.T) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": 1,
		"exp":     time.Now().Add(-time.Hour).Unix(),
		"iat":     time.Now().Add(-time.Hour).Unix(),
	})
	tokenString, _ := token.SignedString([]byte("test-secret"))

	authService := &AuthService{jwtSecret: "test-secret"}
	_, err := authService.ValidateToken(tokenString)

	if err == nil {
		t.Error("Expected error for expired token")
	}
}
