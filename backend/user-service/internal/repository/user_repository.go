package repository

import (
	"github.com/meetup/backend/user-service/internal/models"
	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *UserRepository) FindByID(id uint) (*models.User, error) {
	var user models.User
	err := r.db.First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindByEmail(email string) (*models.User, error) {
	var user models.User
	err := r.db.Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindByUsername(username string) (*models.User, error) {
	var user models.User
	err := r.db.Where("username = ?", username).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) Update(user *models.User) error {
	return r.db.Save(user).Error
}

func (r *UserRepository) Search(query string, limit int) ([]models.User, error) {
	var users []models.User
	err := r.db.Where("username ILIKE ? OR first_name ILIKE ? OR last_name ILIKE ?",
		"%"+query+"%", "%"+query+"%", "%"+query+"%").
		Limit(limit).
		Find(&users).Error
	return users, err
}

func (r *UserRepository) GetFriends(userID uint) ([]models.User, error) {
	var users []models.User
	err := r.db.Joins("JOIN friendships ON friendships.friend_id = users.id").
		Where("friendships.user_id = ?", userID).
		Find(&users).Error
	return users, err
}

func (r *UserRepository) GetFriendSuggestions(userID uint, limit int) ([]models.User, error) {
	var users []models.User
	err := r.db.Where("id != ?", userID).
		Where("id NOT IN (SELECT friend_id FROM friendships WHERE user_id = ?)", userID).
		Where("id NOT IN (SELECT sender_id FROM friend_requests WHERE receiver_id = ? AND status = 'pending')", userID).
		Where("id NOT IN (SELECT receiver_id FROM friend_requests WHERE sender_id = ? AND status = 'pending')", userID).
		Limit(limit).
		Find(&users).Error
	return users, err
}

func (r *UserRepository) CreateFriendRequest(req *models.FriendRequest) error {
	return r.db.Create(req).Error
}

func (r *UserRepository) GetFriendRequest(id uint) (*models.FriendRequest, error) {
	var req models.FriendRequest
	err := r.db.First(&req, id).Error
	if err != nil {
		return nil, err
	}
	return &req, nil
}

func (r *UserRepository) UpdateFriendRequest(req *models.FriendRequest) error {
	return r.db.Save(req).Error
}

func (r *UserRepository) GetPendingRequests(userID uint) ([]models.FriendRequest, error) {
	var requests []models.FriendRequest
	err := r.db.Where("receiver_id = ? AND status = 'pending'", userID).
		Preload("Sender").
		Find(&requests).Error
	return requests, err
}

func (r *UserRepository) CreateFriendship(userID, friendID uint) error {
	friendship1 := models.Friendship{UserID: userID, FriendID: friendID}
	friendship2 := models.Friendship{UserID: friendID, FriendID: userID}

	if err := r.db.Create(&friendship1).Error; err != nil {
		return err
	}
	return r.db.Create(&friendship2).Error
}

func (r *UserRepository) DeleteFriendship(userID, friendID uint) error {
	if err := r.db.Where("user_id = ? AND friend_id = ?", userID, friendID).Delete(&models.Friendship{}).Error; err != nil {
		return err
	}
	return r.db.Where("user_id = ? AND friend_id = ?", friendID, userID).Delete(&models.Friendship{}).Error
}

func (r *UserRepository) AreFriends(userID, friendID uint) bool {
	var count int64
	r.db.Model(&models.Friendship{}).
		Where("user_id = ? AND friend_id = ?", userID, friendID).
		Count(&count)
	return count > 0
}
