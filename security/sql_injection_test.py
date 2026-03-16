#!/usr/bin/env python3
"""
SQL Injection Test Script
Tests the backend API for SQL injection vulnerabilities
"""

import requests
import json

BASE_URL = "http://localhost:8080"

def test_search_injection():
    """Test SQL injection in search endpoint"""
    print("Testing SQL Injection in search endpoint...")
    
    # Common SQL injection payloads
    payloads = [
        "' OR '1'='1",
        "' OR '1'='1' --",
        "'; DROP TABLE events; --",
        "' UNION SELECT null,null,null,null,null,null,null,null,null --",
        "' AND (SELECT 1 FROM (SELECT SLEEP(5))a) --",
    ]
    
    for payload in payloads:
        try:
            print(f"Testing payload: {payload}")
            response = requests.get(f"{BASE_URL}/events/search?q={payload}")
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                print(f"Response length: {len(response.text)}")
                # Check if response contains database error
                if "error" in response.text.lower() or "syntax" in response.text.lower():
                    print("  -> Potential vulnerability detected (error response)")
                else:
                    print("  -> No obvious error in response")
            else:
                print(f"  -> Status code: {response.status_code}")
        except Exception as e:
            print(f"  -> Error: {e}")
        print()

def test_login_injection():
    """Test SQL injection in login endpoint"""
    print("Testing SQL Injection in login endpoint...")
    
    payloads = [
        {"email": "admin' OR '1'='1' --", "password": "anything"},
        {"email": "admin@localhost", "password": "' OR '1'='1' --"},
    ]
    
    for payload in payloads:
        try:
            print(f"Testing payload: {payload}")
            response = requests.post(f"{BASE_URL}/login", json=payload)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                print(f"Response: {response.text[:200]}")
            else:
                print(f"  -> Status code: {response.status_code}")
        except Exception as e:
            print(f"  -> Error: {e}")
        print()

def test_event_creation_injection():
    """Test SQL injection in event creation"""
    print("Testing SQL Injection in event creation...")
    
    # First, get a valid token (using default test user)
    try:
        login_response = requests.post(f"{BASE_URL}/login", json={
            "email": "test@example.com",
            "password": "password123"
        })
        if login_response.status_code == 200:
            token = login_response.json().get("token")
            print(f"Got token: {token[:20]}...")
        else:
            print("Could not get token, using no auth")
            token = None
    except:
        token = None
    
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    payloads = [
        {"title": "Test Event'; DROP TABLE events; --", "event_date": "2026-12-31T23:59:59Z", "latitude": 0, "longitude": 0, "is_free": True},
        {"title": "Test Event", "event_date": "2026-12-31T23:59:59Z' --", "latitude": 0, "longitude": 0, "is_free": True},
    ]
    
    for payload in payloads:
        try:
            print(f"Testing payload: {payload['title']}")
            response = requests.post(f"{BASE_URL}/events", json=payload, headers=headers)
            print(f"Status: {response.status_code}")
            if response.status_code == 201:
                print("  -> Event created (injection might have failed)")
            elif response.status_code == 400:
                print("  -> Validation error (good)")
            else:
                print(f"  -> Response: {response.text[:200]}")
        except Exception as e:
            print(f"  -> Error: {e}")
        print()

if __name__ == "__main__":
    test_search_injection()
    test_login_injection()
    test_event_creation_injection()