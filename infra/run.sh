#!/bin/bash

# SocialConnect Infrastructure Runner
# This script starts all services needed for the application

set -e

echo "========================================="
echo "SocialConnect Infrastructure Starter"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="$PWD/backend"
FRONTEND_DIR="$PWD/frontend-web"
LOGS_DIR="$PWD/logs"

# Create logs directory if it doesn't exist
mkdir -p "$LOGS_DIR"

# Function to check if a port is in use
check_port() {
    lsof -i :$1 > /dev/null 2>&1
    return $?
}

# Function to kill process using a port
kill_port() {
    local port=$1
    local pid=$(lsof -t -i :$port)
    if [ ! -z "$pid" ]; then
        echo "Killing process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null || true
    fi
}

# Function to wait for service
wait_for_service() {
    local port=$1
    local name=$2
    local max_attempts=30
    local attempt=1

    echo "Waiting for $name on port $port..."

    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:$port > /dev/null 2>&1; then
            echo -e "${GREEN}✓ $name is running on port $port${NC}"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
    done

    echo -e "${RED}✗ $name failed to start on port $port${NC}"
    return 1
}

# Function to stop all services
stop_services() {
    echo -e "\n${YELLOW}Stopping all services...${NC}"

    # Stop backend services
    echo "Stopping backend services..."
    kill_port 8080  # API Gateway
    kill_port 8081  # User Service
    kill_port 8082  # Event Service
    kill_port 8083  # Message Service

    # Stop frontend
    echo "Stopping frontend..."
    pkill -f "next dev" 2>/dev/null || true
    kill_port 3000

    echo -e "${GREEN}All services stopped${NC}"
}

# Function to start backend services
start_backend() {
    echo -e "\n${YELLOW}Starting backend services...${NC}"

    cd "$BACKEND_DIR"

    # Check if binaries exist, if not build them
    for service in user-service event-service message-service api-gateway; do
        if [ ! -f "$service/$service" ]; then
            echo "Building $service..."
            cd "$service" && go build -o "$service" . && cd ..
        fi
    done

    # Start services in order
    echo "Starting user-service on port 8081..."
    nohup ./user-service/user-service > "$LOGS_DIR/user-service.log" 2>&1 &
    sleep 2

    echo "Starting event-service on port 8082..."
    nohup ./event-service/event-service > "$LOGS_DIR/event-service.log" 2>&1 &
    sleep 2

    echo "Starting message-service on port 8083..."
    nohup ./message-service/message-service > "$LOGS_DIR/message-service.log" 2>&1 &
    sleep 2

    echo "Starting api-gateway on port 8080..."
    nohup ./api-gateway/api-gateway > "$LOGS_DIR/api-gateway.log" 2>&1 &
    sleep 2

    cd "$PWD"

    # Wait for services to be ready
    wait_for_service 8081 "User Service" || return 1
    wait_for_service 8082 "Event Service" || return 1
    wait_for_service 8083 "Message Service" || return 1
    wait_for_service 8080 "API Gateway" || return 1
}

# Function to start frontend
start_frontend() {
    echo -e "\n${YELLOW}Starting frontend...${NC}"

    cd "$FRONTEND_DIR"

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm install
    fi

    echo "Starting Next.js dev server on port 3000..."
    nohup npm run dev > "$LOGS_DIR/frontend.log" 2>&1 &
    
    cd "$PWD"

    # Wait for frontend to be ready
    wait_for_service 3000 "Frontend" || return 1
}

# Function to show status
show_status() {
    echo -e "\n${YELLOW}Service Status:${NC}"
    echo "-----------------------------------"

    # Backend services
    for port in 8080 8081 8082 8083; do
        if check_port $port; then
            echo -e "✓ Port $port: ${GREEN}Running${NC}"
        else
            echo -e "✗ Port $port: ${RED}Stopped${NC}"
        fi
    done

    # Frontend
    if check_port 3000; then
        echo -e "✓ Port 3000 (Frontend): ${GREEN}Running${NC}"
    else
        echo -e "✗ Port 3000 (Frontend): ${RED}Stopped${NC}"
    fi

    echo "-----------------------------------"
}

# Main menu
case "${1:-start}" in
    start)
        echo "Starting SocialConnect infrastructure..."
        start_backend
        start_frontend
        show_status
        echo -e "\n${GREEN}✓ All services started successfully!${NC}"
        echo "Frontend: http://localhost:3000"
        echo "Backend API: http://localhost:8080"
        echo -e "\nTo stop services, run: $0 stop"
        ;;
    stop)
        stop_services
        ;;
    status)
        show_status
        ;;
    restart)
        stop_services
        sleep 2
        start_backend
        start_frontend
        show_status
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        echo "  start   - Start all services"
        echo "  stop    - Stop all services"
        echo "  restart - Restart all services"
        echo "  status  - Show service status"
        exit 1
        ;;
esac
