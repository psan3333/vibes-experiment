# Multi-stage build for SocialConnect backend services
FROM golang:1.25-alpine AS builder

# Install git and other dependencies
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy go.mod and go.sum files for each service
COPY backend/user-service/go.mod backend/user-service/go.sum ./user-service/
COPY backend/event-service/go.mod backend/event-service/go.sum ./event-service/
COPY backend/message-service/go.mod backend/message-service/go.sum ./message-service/
COPY backend/api-gateway/go.mod backend/api-gateway/go.sum ./api-gateway/

# Download dependencies for all services
RUN cd user-service && go mod download
RUN cd event-service && go mod download
RUN cd message-service && go mod download
RUN cd api-gateway && go mod download

# Copy source code
COPY backend/ ./backend/

# Build all services
RUN cd backend/user-service && go build -o /app/user-service .
RUN cd backend/event-service && go build -o /app/event-service .
RUN cd backend/message-service && go build -o /app/message-service .
RUN cd backend/api-gateway && go build -o /app/api-gateway .

# Create final image with all services
FROM alpine:latest

# Install ca-certificates for HTTPS requests
RUN apk --no-cache add ca-certificates

# Create app directory
WORKDIR /app

# Copy built binaries from builder
COPY --from=builder /app/user-service .
COPY --from=builder /app/event-service .
COPY --from=builder /app/message-service .
COPY --from=builder /app/api-gateway .

# Create a simple script to run all services
RUN echo '#!/bin/sh' > /app/run-services.sh && \
    echo 'nohup ./user-service > /var/log/user-service.log 2>&1 &' >> /app/run-services.sh && \
    echo 'nohup ./event-service > /var/log/event-service.log 2>&1 &' >> /app/run-services.sh && \
    echo 'nohup ./message-service > /var/log/message-service.log 2>&1 &' >> /app/run-services.sh && \
    echo 'nohup ./api-gateway > /var/log/api-gateway.log 2>&1 &' >> /app/run-services.sh && \
    echo 'tail -f /var/log/*.log' >> /app/run-services.sh && \
    chmod +x /app/run-services.sh

# Expose ports
EXPOSE 8080 8081 8082 8083

# Run all services
CMD ["/app/run-services.sh"]
