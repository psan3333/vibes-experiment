package services

import (
	"errors"
	"regexp"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/meetup/backend/user-service/internal/models"
	"github.com/meetup/backend/user-service/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

type AuthService struct {
	userRepo  *repository.UserRepository
	jwtSecret string
}

func NewAuthService(userRepo *repository.UserRepository, jwtSecret string) *AuthService {
	return &AuthService{
		userRepo:  userRepo,
		jwtSecret: jwtSecret,
	}
}

type RegisterInput struct {
	Email       string `json:"email" binding:"required,email"`
	Username    string `json:"username" binding:"required"`
	Password    string `json:"password" binding:"required,min=6"`
	FirstName   string `json:"first_name" binding:"required"`
	LastName    string `json:"last_name" binding:"required"`
	Age         int    `json:"age" binding:"required,gte=18"`
	IsOrganizer bool   `json:"is_organizer"`
}

type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func (s *AuthService) Register(input RegisterInput) (*models.UserResponse, string, error) {
	// Validate email format - stricter validation
	if len(input.Email) > 254 {
		return nil, "", errors.New("email too long (max 254 characters)")
	}
	if !emailRegex.MatchString(input.Email) {
		return nil, "", errors.New("invalid email format")
	}

	// Validate password strength
	if len(input.Password) < 8 {
		return nil, "", errors.New("password must be at least 8 characters long")
	}
	// Check for common weak passwords
	weakPasswords := []string{"password", "123456", "password123", "12345678", "qwerty", "abc123", "111111", "1234567"}
	lowerPass := strings.ToLower(input.Password)
	for _, weak := range weakPasswords {
		if lowerPass == weak || strings.Contains(lowerPass, weak) {
			return nil, "", errors.New("password is too common, please choose a stronger password")
		}
	}

	// Validate username (alphanumeric and underscore only, 3-30 chars)
	if len(input.Username) < 3 || len(input.Username) > 30 {
		return nil, "", errors.New("username must be between 3 and 30 characters")
	}
	usernameRegex := regexp.MustCompile(`^[a-zA-Z0-9_]+$`)
	if !usernameRegex.MatchString(input.Username) {
		return nil, "", errors.New("username can only contain letters, numbers, and underscores")
	}

	// Validate name lengths
	if len(input.FirstName) > 100 {
		return nil, "", errors.New("first name too long (max 100 characters)")
	}
	if len(input.LastName) > 100 {
		return nil, "", errors.New("last name too long (max 100 characters)")
	}

	// Validate age
	if input.Age < 18 {
		return nil, "", errors.New("you must be at least 18 years old")
	}

	// Check if email already exists
	existingUser, _ := s.userRepo.FindByEmail(input.Email)
	if existingUser != nil {
		return nil, "", errors.New("email already registered")
	}

	// Check if username already exists
	existingUsername, _ := s.userRepo.FindByUsername(input.Username)
	if existingUsername != nil {
		return nil, "", errors.New("username already taken")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", err
	}

	user := &models.User{
		Email:        input.Email,
		Username:     input.Username,
		PasswordHash: string(hashedPassword),
		FirstName:    input.FirstName,
		LastName:     input.LastName,
		Age:          input.Age,
		IsOrganizer:  input.IsOrganizer,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, "", err
	}

	token, err := s.generateToken(user.ID)
	if err != nil {
		return nil, "", err
	}

	resp := user.ToResponse()
	return &resp, token, nil
}

func (s *AuthService) Login(input LoginInput) (*models.UserResponse, string, error) {
	// Validate email format
	if !emailRegex.MatchString(input.Email) {
		return nil, "", errors.New("invalid email format")
	}

	user, err := s.userRepo.FindByEmail(input.Email)
	if err != nil {
		return nil, "", errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		return nil, "", errors.New("invalid credentials")
	}

	token, err := s.generateToken(user.ID)
	if err != nil {
		return nil, "", err
	}

	resp := user.ToResponse()
	return &resp, token, nil
}

func (s *AuthService) generateToken(userID uint) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(time.Hour * 24 * 7).Unix(),
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}

func (s *AuthService) ValidateToken(tokenString string) (uint, error) {
	if tokenString == "" {
		return 0, errors.New("token is required")
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("invalid signing method")
		}
		return []byte(s.jwtSecret), nil
	})

	if err != nil {
		return 0, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		userID := uint(claims["user_id"].(float64))
		return userID, nil
	}

	return 0, errors.New("invalid token")
}

type UserService struct {
	userRepo *repository.UserRepository
}

func NewUserService(userRepo *repository.UserRepository) *UserService {
	return &UserService{userRepo: userRepo}
}

func (s *UserService) GetProfile(userID uint) (*models.UserResponse, error) {
	// Validate user ID
	if userID == 0 {
		return nil, errors.New("invalid user ID")
	}

	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}
	response := user.ToResponse()
	return &response, nil
}

type UpdateProfileInput struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Bio       string `json:"bio"`
}

func (s *UserService) UpdateProfile(userID uint, input UpdateProfileInput) (*models.UserResponse, error) {
	// Validate user ID
	if userID == 0 {
		return nil, errors.New("invalid user ID")
	}

	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if input.FirstName != "" {
		user.FirstName = input.FirstName
	}
	if input.LastName != "" {
		user.LastName = input.LastName
	}
	if input.Bio != "" {
		user.Bio = input.Bio
	}

	if err := s.userRepo.Update(user); err != nil {
		return nil, err
	}

	response := user.ToResponse()
	return &response, nil
}

func (s *UserService) UpdateAvatar(userID uint, avatarURL string) (*models.UserResponse, error) {
	// Validate user ID
	if userID == 0 {
		return nil, errors.New("invalid user ID")
	}

	// Validate avatar URL (basic check)
	if avatarURL == "" {
		return nil, errors.New("avatar URL is required")
	}

	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	user.AvatarURL = avatarURL

	if err := s.userRepo.Update(user); err != nil {
		return nil, err
	}

	response := user.ToResponse()
	return &response, nil
}

func (s *UserService) SearchUsers(query string, limit int) ([]models.UserResponse, error) {
	// Validate limit
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100 // Max limit
	}

	users, err := s.userRepo.Search(query, limit)
	if err != nil {
		return nil, err
	}

	responses := make([]models.UserResponse, len(users))
	for i, user := range users {
		responses[i] = user.ToResponse()
	}
	return responses, nil
}

func (s *UserService) GetFriendSuggestions(userID uint, limit int) ([]models.UserResponse, error) {
	// Validate user ID
	if userID == 0 {
		return nil, errors.New("invalid user ID")
	}

	// Validate limit
	if limit <= 0 {
		limit = 10
	}
	if limit > 50 {
		limit = 50 // Max limit
	}

	users, err := s.userRepo.GetFriendSuggestions(userID, limit)
	if err != nil {
		return nil, err
	}

	responses := make([]models.UserResponse, len(users))
	for i, user := range users {
		responses[i] = user.ToResponse()
	}
	return responses, nil
}

type SendFriendRequestInput struct {
	ReceiverID uint `json:"receiver_id" binding:"required"`
}

func (s *UserService) SendFriendRequest(senderID uint, input SendFriendRequestInput) error {
	// Validate IDs
	if senderID == 0 {
		return errors.New("invalid sender ID")
	}
	if input.ReceiverID == 0 {
		return errors.New("invalid receiver ID")
	}
	if senderID == input.ReceiverID {
		return errors.New("cannot send friend request to yourself")
	}

	if s.userRepo.AreFriends(senderID, input.ReceiverID) {
		return errors.New("already friends")
	}

	req := &models.FriendRequest{
		SenderID:   senderID,
		ReceiverID: input.ReceiverID,
		Status:     "pending",
	}

	return s.userRepo.CreateFriendRequest(req)
}

func (s *UserService) AcceptFriendRequest(userID uint, requestID uint) error {
	// Validate IDs
	if userID == 0 {
		return errors.New("invalid user ID")
	}
	if requestID == 0 {
		return errors.New("invalid request ID")
	}

	req, err := s.userRepo.GetFriendRequest(requestID)
	if err != nil {
		return errors.New("friend request not found")
	}

	if req.ReceiverID != userID {
		return errors.New("not authorized to accept this request")
	}

	req.Status = "accepted"
	if err := s.userRepo.UpdateFriendRequest(req); err != nil {
		return err
	}

	return s.userRepo.CreateFriendship(req.SenderID, req.ReceiverID)
}

func (s *UserService) RejectFriendRequest(userID uint, requestID uint) error {
	// Validate IDs
	if userID == 0 {
		return errors.New("invalid user ID")
	}
	if requestID == 0 {
		return errors.New("invalid request ID")
	}

	req, err := s.userRepo.GetFriendRequest(requestID)
	if err != nil {
		return errors.New("friend request not found")
	}

	if req.ReceiverID != userID {
		return errors.New("not authorized to reject this request")
	}

	req.Status = "rejected"
	return s.userRepo.UpdateFriendRequest(req)
}

func (s *UserService) GetFriends(userID uint) ([]models.UserResponse, error) {
	// Validate user ID
	if userID == 0 {
		return nil, errors.New("invalid user ID")
	}

	users, err := s.userRepo.GetFriends(userID)
	if err != nil {
		return nil, err
	}

	responses := make([]models.UserResponse, len(users))
	for i, user := range users {
		responses[i] = user.ToResponse()
	}
	return responses, nil
}

func (s *UserService) RemoveFriend(userID, friendID uint) error {
	// Validate IDs
	if userID == 0 {
		return errors.New("invalid user ID")
	}
	if friendID == 0 {
		return errors.New("invalid friend ID")
	}
	if userID == friendID {
		return errors.New("cannot remove yourself from friends")
	}

	return s.userRepo.DeleteFriendship(userID, friendID)
}
