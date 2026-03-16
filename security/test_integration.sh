#!/bin/bash

# Test Backend API
echo "Testing Backend API..."
curl -s http://localhost:8080/events
echo ""

# Test Frontend
echo "Testing Frontend..."
curl -s http://localhost:3002 | grep -o "Meetup App" | head -1
echo ""

# Test CORS
echo "Testing CORS..."
curl -s -I -H "Origin: http://localhost:3002" http://localhost:8080/events | grep "Access-Control-Allow-Origin"
echo ""

echo "Integration tests completed."