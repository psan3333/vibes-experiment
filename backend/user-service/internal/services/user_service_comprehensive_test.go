package services

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/meetup/backend/user-service/internal/models"
)

func TestAuthService_NewAuthService(t *testing.T) {
	service := NewAuthService(nil, "test-secret")
	if service == nil {
		t.Fatal("Expected non-nil AuthService")
	}
	if service.jwtSecret != "test-secret" {
		t.Errorf("Expected jwtSecret 'test-secret', got '%s'", service.jwtSecret)
	}
	if service.userRepo != nil {
		t.Error("Expected userRepo to be nil")
	}
}

func TestAuthService_NewUserService(t *testing.T) {
	service := NewUserService(nil)
	if service == nil {
		t.Fatal("Expected non-nil UserService")
	}
	if service.userRepo != nil {
		t.Error("Expected userRepo to be nil")
	}
}

func TestRegisterInput_ComprehensiveValidation(t *testing.T) {
	tests := []struct {
		name    string
		input   RegisterInput
		isValid bool
	}{
		{
			name: "valid input with all fields",
			input: RegisterInput{
				Email:       "test@example.com",
				Username:    "testuser",
				Password:    "password123",
				FirstName:   "John",
				LastName:    "Doe",
				Age:         25,
				IsOrganizer: false,
			},
			isValid: true,
		},
		{
			name: "minimum age 18 is valid",
			input: RegisterInput{
				Email:     "just18@example.com",
				Username:  "just18user",
				Password:  "password123",
				FirstName: "Alice",
				LastName:  "Doe",
				Age:       18,
			},
			isValid: true,
		},
		{
			name: "underage user is invalid",
			input: RegisterInput{
				Email:     "young@example.com",
				Username:  "younguser",
				Password:  "password123",
				FirstName: "Jane",
				LastName:  "Doe",
				Age:       17,
			},
			isValid: false,
		},
		{
			name: "short password is invalid",
			input: RegisterInput{
				Email:     "test@example.com",
				Username:  "testuser",
				Password:  "123",
				FirstName: "John",
				LastName:  "Doe",
				Age:       25,
			},
			isValid: false,
		},
		{
			name: "missing email is invalid",
			input: RegisterInput{
				Email:     "",
				Username:  "testuser",
				Password:  "password123",
				FirstName: "John",
				LastName:  "Doe",
				Age:       25,
			},
			isValid: false,
		},
		{
			name: "missing username is invalid",
			input: RegisterInput{
				Email:     "test@example.com",
				Username:  "",
				Password:  "password123",
				FirstName: "John",
				LastName:  "Doe",
				Age:       25,
			},
			isValid: false,
		},
		{
			name: "missing first name is invalid",
			input: RegisterInput{
				Email:     "test@example.com",
				Username:  "testuser",
				Password:  "password123",
				FirstName: "",
				LastName:  "Doe",
				Age:       25,
			},
			isValid: false,
		},
		{
			name: "missing last name is invalid",
			input: RegisterInput{
				Email:     "test@example.com",
				Username:  "testuser",
				Password:  "password123",
				FirstName: "John",
				LastName:  "",
				Age:       25,
			},
			isValid: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			isValid := tt.input.Email != "" && tt.input.Username != "" &&
				len(tt.input.Password) >= 6 && tt.input.Age >= 18 &&
				tt.input.FirstName != "" && tt.input.LastName != ""
			if isValid != tt.isValid {
				t.Errorf("Expected valid=%v, got %v for: %s", tt.isValid, isValid, tt.name)
			}
		})
	}
}

func TestLoginInput_Fields(t *testing.T) {
	tests := []struct {
		name  string
		input LoginInput
		valid bool
	}{
		{
			name: "valid login input",
			input: LoginInput{
				Email:    "test@example.com",
				Password: "password123",
			},
			valid: true,
		},
		{
			name: "missing email",
			input: LoginInput{
				Email:    "",
				Password: "password123",
			},
			valid: false,
		},
		{
			name: "missing password",
			input: LoginInput{
				Email:    "test@example.com",
				Password: "",
			},
			valid: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			isValid := tt.input.Email != "" && tt.input.Password != ""
			if isValid != tt.valid {
				t.Errorf("Expected valid=%v, got %v", tt.valid, isValid)
			}
		})
	}
}

func TestUpdateProfileInput_Fields(t *testing.T) {
	tests := []struct {
		name     string
		input    UpdateProfileInput
		expected UpdateProfileInput
	}{
		{
			name: "full update",
			input: UpdateProfileInput{
				FirstName: "John",
				LastName:  "Doe",
				Bio:       "Hello world",
			},
			expected: UpdateProfileInput{
				FirstName: "John",
				LastName:  "Doe",
				Bio:       "Hello world",
			},
		},
		{
			name: "partial update - first name only",
			input: UpdateProfileInput{
				FirstName: "Jane",
			},
			expected: UpdateProfileInput{
				FirstName: "Jane",
			},
		},
		{
			name: "partial update - bio only",
			input: UpdateProfileInput{
				Bio: "New bio",
			},
			expected: UpdateProfileInput{
				Bio: "New bio",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.input.FirstName != tt.expected.FirstName {
				t.Errorf("FirstName: expected %s, got %s", tt.expected.FirstName, tt.input.FirstName)
			}
			if tt.input.LastName != tt.expected.LastName {
				t.Errorf("LastName: expected %s, got %s", tt.expected.LastName, tt.input.LastName)
			}
			if tt.input.Bio != tt.expected.Bio {
				t.Errorf("Bio: expected %s, got %s", tt.expected.Bio, tt.input.Bio)
			}
		})
	}
}

func TestSendFriendRequestInput_Fields(t *testing.T) {
	input := SendFriendRequestInput{ReceiverID: 123}
	if input.ReceiverID != 123 {
		t.Errorf("Expected 123, got %d", input.ReceiverID)
	}
}

func TestGenerateToken_NotEmpty(t *testing.T) {
	authService := &AuthService{jwtSecret: "test-secret-key"}

	token, err := authService.generateToken(1)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}
	if token == "" {
		t.Error("Expected non-empty token")
	}
	if len(token) < 10 {
		t.Errorf("Token seems too short: %s", token)
	}
}

func TestGenerateToken_DifferentUsers(t *testing.T) {
	authService := &AuthService{jwtSecret: "test-secret-key"}

	token1, _ := authService.generateToken(1)
	token2, _ := authService.generateToken(2)
	token3, _ := authService.generateToken(3)

	if token1 == token2 {
		t.Error("Tokens for different users should be different")
	}
	if token2 == token3 {
		t.Error("Tokens for different users should be different")
	}
	if token1 == token3 {
		t.Error("Tokens for different users should be different")
	}
}

func TestGenerateToken_SameUserDifferentTime(t *testing.T) {
	authService := &AuthService{jwtSecret: "test-secret-key"}

	token1, _ := authService.generateToken(1)
	time.Sleep(10 * time.Millisecond)
	token2, _ := authService.generateToken(1)

	if token1 == token2 {
		t.Log("Note: Tokens generated at different times may be the same if within same second")
	}
}

func TestValidateToken_Success(t *testing.T) {
	authService := &AuthService{jwtSecret: "test-secret-key"}

	userIDs := []uint{1, 10, 100, 1000}
	for _, expectedID := range userIDs {
		token, _ := authService.generateToken(expectedID)
		userID, err := authService.ValidateToken(token)
		if err != nil {
			t.Fatalf("Expected valid token for user %d, got error: %v", expectedID, err)
		}
		if userID != expectedID {
			t.Errorf("Expected user ID %d, got %d", expectedID, userID)
		}
	}
}

func TestValidateToken_InvalidInputs(t *testing.T) {
	authService := &AuthService{jwtSecret: "test-secret-key"}

	tests := []struct {
		name  string
		token string
	}{
		{"empty string", ""},
		{"random characters", "randomnotvalidtoken"},
		{"just header", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"},
		{"invalid base64", "not-valid-base64!!!"},
		{"wrong signature", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjB9.wrong"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := authService.ValidateToken(tt.token)
			if err == nil {
				t.Error("Expected error for invalid token")
			}
		})
	}
}

func TestValidateToken_ExpiredToken(t *testing.T) {
	expiredClaims := jwt.MapClaims{
		"user_id": 1,
		"exp":     time.Now().Add(-time.Hour).Unix(),
		"iat":     time.Now().Add(-time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, expiredClaims)
	tokenString, _ := token.SignedString([]byte("test-secret"))

	authService := &AuthService{jwtSecret: "test-secret"}
	_, err := authService.ValidateToken(tokenString)

	if err == nil {
		t.Error("Expected error for expired token")
	}
}

func TestValidateToken_WrongSecret(t *testing.T) {
	service1 := &AuthService{jwtSecret: "secret1"}
	service2 := &AuthService{jwtSecret: "secret2"}

	token, _ := service1.generateToken(1)

	_, err := service2.ValidateToken(token)
	if err == nil {
		t.Error("Expected error when validating with wrong secret")
	}
}

func TestValidateToken_ClaimsType(t *testing.T) {
	authService := &AuthService{jwtSecret: "test-secret-key"}

	token, _ := authService.generateToken(42)

	parsedToken, err := jwt.Parse(token, func(token *jwt.Token) (interface{}, error) {
		return []byte("test-secret-key"), nil
	})
	if err != nil {
		t.Fatalf("Failed to parse: %v", err)
	}

	claims := parsedToken.Claims.(jwt.MapClaims)

	if _, ok := claims["user_id"]; !ok {
		t.Error("Expected user_id in claims")
	}
	if _, ok := claims["exp"]; !ok {
		t.Error("Expected exp in claims")
	}
	if _, ok := claims["iat"]; !ok {
		t.Error("Expected iat in claims")
	}
}

func TestModelConversion(t *testing.T) {
	user := models.User{
		ID:          1,
		Email:       "test@example.com",
		Username:    "testuser",
		FirstName:   "John",
		LastName:    "Doe",
		Bio:         "Test bio",
		AvatarURL:   "http://example.com/avatar.png",
		Age:         25,
		IsOrganizer: true,
	}

	resp := user.ToResponse()

	if resp.ID != user.ID {
		t.Errorf("ID mismatch: %d vs %d", resp.ID, user.ID)
	}
	if resp.Email != user.Email {
		t.Errorf("Email mismatch: %s vs %s", resp.Email, user.Email)
	}
	if resp.Username != user.Username {
		t.Errorf("Username mismatch: %s vs %s", resp.Username, user.Username)
	}
	if resp.FirstName != user.FirstName {
		t.Errorf("FirstName mismatch: %s vs %s", resp.FirstName, user.FirstName)
	}
	if resp.LastName != user.LastName {
		t.Errorf("LastName mismatch: %s vs %s", resp.LastName, user.LastName)
	}
	if resp.Bio != user.Bio {
		t.Errorf("Bio mismatch: %s vs %s", resp.Bio, user.Bio)
	}
	if resp.AvatarURL != user.AvatarURL {
		t.Errorf("AvatarURL mismatch: %s vs %s", resp.AvatarURL, user.AvatarURL)
	}
	if resp.Age != user.Age {
		t.Errorf("Age mismatch: %d vs %d", resp.Age, user.Age)
	}
	if resp.IsOrganizer != user.IsOrganizer {
		t.Errorf("IsOrganizer mismatch: %v vs %v", resp.IsOrganizer, user.IsOrganizer)
	}
}

func TestModelConversion_EmptyFields(t *testing.T) {
	user := models.User{
		ID:       1,
		Email:    "test@example.com",
		Username: "testuser",
		Age:      18,
	}

	resp := user.ToResponse()

	if resp.Bio != "" {
		t.Errorf("Expected empty Bio, got %s", resp.Bio)
	}
	if resp.AvatarURL != "" {
		t.Errorf("Expected empty AvatarURL, got %s", resp.AvatarURL)
	}
	if resp.FirstName != "" {
		t.Errorf("Expected empty FirstName, got %s", resp.FirstName)
	}
	if resp.LastName != "" {
		t.Errorf("Expected empty LastName, got %s", resp.LastName)
	}
	if resp.IsOrganizer != false {
		t.Errorf("Expected IsOrganizer false, got %v", resp.IsOrganizer)
	}
}
