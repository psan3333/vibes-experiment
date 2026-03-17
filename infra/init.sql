-- SocialConnect Database Initialization
-- This script sets up the initial database structure

-- Create extension for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (shared across services via database)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    age INTEGER,
    bio TEXT,
    avatar_url VARCHAR(255),
    is_organizer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address VARCHAR(500),
    is_free BOOLEAN DEFAULT TRUE,
    price DOUBLE PRECISION DEFAULT 0,
    organizer_id INTEGER NOT NULL,
    category VARCHAR(50),
    max_attendees INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Event attendees table
CREATE TABLE IF NOT EXISTS event_attendees (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    ticket_id VARCHAR(100) UNIQUE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_events_latitude_longitude ON events(latitude, longitude);
CREATE INDEX idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX idx_event_attendees_user_id ON event_attendees(user_id);
CREATE INDEX idx_event_attendees_status ON event_attendees(status);
CREATE INDEX idx_messages_group_id ON messages(group_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Insert sample user for testing
INSERT INTO users (username, email, password_hash, first_name, last_name, age, is_organizer) 
VALUES (
    'testuser', 
    'test@example.com', 
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password: password123
    'Test', 
    'User', 
    25, 
    TRUE
) ON CONFLICT (username) DO NOTHING;

-- Insert sample events
INSERT INTO events (title, description, event_date, latitude, longitude, address, is_free, organizer_id, category) 
VALUES 
    (
        'Tech Meetup', 
        'Monthly tech meetup for developers', 
        CURRENT_TIMESTAMP + INTERVAL '7 days', 
        55.7558, 
        37.6173, 
        'Moscow, Russia', 
        TRUE, 
        1, 
        'Technology'
    ),
    (
        'Music Festival', 
        'Annual music festival with top artists', 
        CURRENT_TIMESTAMP + INTERVAL '14 days', 
        55.7558, 
        37.6173, 
        'Central Park', 
        FALSE, 
        1, 
        'Music'
    )
ON CONFLICT DO NOTHING;
