package config

import (
	"os"
	"testing"
)

func TestLoad_DefaultValues(t *testing.T) {
	os.Unsetenv("DATABASE_URL")
	os.Unsetenv("JWT_SECRET")
	os.Unsetenv("PORT")

	cfg := Load()

	if cfg.DatabaseURL == "" {
		t.Error("Expected non-empty DatabaseURL")
	}
	if cfg.JWTSecret == "" {
		t.Error("Expected non-empty JWTSecret")
	}
	if cfg.Port == "" {
		t.Error("Expected non-empty Port")
	}
}

func TestLoad_EnvironmentOverrides(t *testing.T) {
	os.Setenv("DATABASE_URL", "postgres://test:test@localhost:5432/testdb")
	os.Setenv("JWT_SECRET", "test-secret-123")
	os.Setenv("PORT", "9999")
	defer os.Unsetenv("DATABASE_URL")
	defer os.Unsetenv("JWT_SECRET")
	defer os.Unsetenv("PORT")

	cfg := Load()

	if cfg.DatabaseURL != "postgres://test:test@localhost:5432/testdb" {
		t.Errorf("Expected DatabaseURL, got %s", cfg.DatabaseURL)
	}
	if cfg.JWTSecret != "test-secret-123" {
		t.Errorf("Expected JWTSecret, got %s", cfg.JWTSecret)
	}
	if cfg.Port != "9999" {
		t.Errorf("Expected Port, got %s", cfg.Port)
	}
}

func TestConfig_Structure(t *testing.T) {
	cfg := &Config{
		DatabaseURL: "postgres://localhost:5432/db",
		JWTSecret:   "secret",
		Port:        "8080",
	}

	if cfg.DatabaseURL == "" {
		t.Error("Expected DatabaseURL to be set")
	}
	if cfg.JWTSecret == "" {
		t.Error("Expected JWTSecret to be set")
	}
	if cfg.Port == "" {
		t.Error("Expected Port to be set")
	}
}
