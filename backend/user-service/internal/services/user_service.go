package services

import (
	"errors"
	"github.com/golang-jwt/jwt/v5"
	"github.com/meetup/backend/user-service/internal/models"
	"github.com/meetup/backend/user-service/internal/repository"
	"golang.org/x/crypto/bcrypt"
	"time"
)

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
	existingUser, _ := s.userRepo.FindByEmail(input.Email)
	if existingUser != nil {
		return nil, "", errors.New("email already registered")
	}

	existingUsername, _ := s.userRepo.FindByUsername(input.Username)
	if existingUsername != nil {
		return nil, "", errors.New("username already taken")
	}

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
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, err
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
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, err
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
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, err
	}

	user.AvatarURL = avatarURL

	if err := s.userRepo.Update(user); err != nil {
		return nil, err
	}

	response := user.ToResponse()
	return &response, nil
}

func (s *UserService) SearchUsers(query string, limit int) ([]models.UserResponse, error) {
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
	req, err := s.userRepo.GetFriendRequest(requestID)
	if err != nil {
		return err
	}

	if req.ReceiverID != userID {
		return errors.New("not authorized")
	}

	req.Status = "accepted"
	if err := s.userRepo.UpdateFriendRequest(req); err != nil {
		return err
	}

	return s.userRepo.CreateFriendship(req.SenderID, req.ReceiverID)
}

func (s *UserService) RejectFriendRequest(userID uint, requestID uint) error {
	req, err := s.userRepo.GetFriendRequest(requestID)
	if err != nil {
		return err
	}

	if req.ReceiverID != userID {
		return errors.New("not authorized")
	}

	req.Status = "rejected"
	return s.userRepo.UpdateFriendRequest(req)
}

func (s *UserService) GetFriends(userID uint) ([]models.UserResponse, error) {
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
	return s.userRepo.DeleteFriendship(userID, friendID)
}
