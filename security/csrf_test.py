#!/usr/bin/env python3
"""
CSRF Test Script
Tests the backend API for CSRF vulnerabilities
"""

import requests
import json

BASE_URL = "http://localhost:8080"

def get_token():
    """Get a valid JWT token"""
    try:
        login_response = requests.post(f"{BASE_URL}/login", json={
            "email": "test2@example.com",
            "password": "SecurePass123!"
        })
        if login_response.status_code == 200:
            token = login_response.json().get("token")
            print(f"Got token: {token[:20]}...")
            return token
        else:
            print("Could not get token")
            return None
    except Exception as e:
        print(f"Error getting token: {e}")
        return None

def test_csrf_with_missing_origin(token):
    """Test if backend accepts requests without Origin header"""
    print("Testing CSRF: Requests without Origin header...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test creating an event without Origin header
    event_data = {
        "title": "CSRF Test Event",
        "description": "Testing CSRF protection",
        "event_date": "2026-12-31T23:59:59Z",
        "latitude": 55.7558,
        "longitude": 37.6173,
        "is_free": True,
    }
    
    try:
        print("Creating event without Origin header...")
        response = requests.post(f"{BASE_URL}/events", json=event_data, headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 201:
            print("  -> Event created (this is expected for JWT-based auth)")
        else:
            print(f"  -> Response: {response.text}")
    except Exception as e:
        print(f"  -> Error: {e}")
    print()

def test_csrf_with_different_origin(token):
    """Test if backend accepts requests from different origins"""
    print("Testing CSRF: Requests from different origins...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Origin": "http://evil.com",
    }
    
    event_data = {
        "title": "CSRF Test Event from Evil Site",
        "description": "Testing CSRF protection with different origin",
        "event_date": "2026-12-31T23:59:59Z",
        "latitude": 55.7558,
        "longitude": 37.6173,
        "is_free": True,
    }
    
    try:
        print("Creating event with Origin: http://evil.com...")
        response = requests.post(f"{BASE_URL}/events", json=event_data, headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 201:
            print("  -> Event created from different origin")
            print("  -> WARNING: Backend accepts requests from untrusted origins!")
        else:
            print(f"  -> Request rejected (good): {response.status_code}")
    except Exception as e:
        print(f"  -> Error: {e}")
    print()

def test_csrf_with_preflight():
    """Test CORS preflight requests"""
    print("Testing CORS preflight requests...")
    
    # Test OPTIONS request (CORS preflight)
    try:
        print("Testing OPTIONS request...")
        response = requests.options(
            f"{BASE_URL}/events",
            headers={
                "Origin": "http://evil.com",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type, Authorization",
            }
        )
        print(f"Status: {response.status_code}")
        print(f"Access-Control-Allow-Origin: {response.headers.get('Access-Control-Allow-Origin')}")
        print(f"Access-Control-Allow-Methods: {response.headers.get('Access-Control-Allow-Methods')}")
        
        if response.status_code == 204:
            allowed_origin = response.headers.get('Access-Control-Allow-Origin')
            if allowed_origin and allowed_origin != "null":
                print(f"  -> CORS preflight allowed for origin: {allowed_origin}")
                if allowed_origin == "*":
                    print("  -> WARNING: Wildcard CORS allows any origin!")
            else:
                print("  -> No Access-Control-Allow-Origin header")
        else:
            print("  -> Preflight request rejected")
    except Exception as e:
        print(f"  -> Error: {e}")
    print()

def test_csrf_with_referrer(token):
    """Test if backend validates Referer header"""
    print("Testing Referer header validation...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Referer": "http://evil.com/page",
    }
    
    event_data = {
        "title": "CSRF Test Event with fake Referer",
        "description": "Testing Referer validation",
        "event_date": "2026-12-31T23:59:59Z",
        "latitude": 55.7558,
        "longitude": 37.6173,
        "is_free": True,
    }
    
    try:
        print("Creating event with fake Referer header...")
        response = requests.post(f"{BASE_URL}/events", json=event_data, headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 201:
            print("  -> Event created (backend doesn't validate Referer)")
        else:
            print(f"  -> Request rejected: {response.status_code}")
    except Exception as e:
        print(f"  -> Error: {e}")
    print()

def test_csrf_state_changing_requests(token):
    """Test state-changing requests without proper protection"""
    print("Testing state-changing requests for CSRF vulnerabilities...")
    
    # Test various state-changing endpoints
    endpoints = [
        ("POST", f"{BASE_URL}/events", {
            "title": "CSRF Test",
            "event_date": "2026-12-31T23:59:59Z",
            "latitude": 55.7558,
            "longitude": 37.6173,
            "is_free": True,
        }),
        ("POST", f"{BASE_URL}/friends/request", {"receiver_id": 1}),
    ]
    
    for method, url, data in endpoints:
        try:
            print(f"Testing {method} {url}")
            headers = {"Authorization": f"Bearer {token}"}
            
            if method == "POST":
                response = requests.post(url, json=data, headers=headers)
            elif method == "PUT":
                response = requests.put(url, json=data, headers=headers)
            elif method == "DELETE":
                response = requests.delete(url, headers=headers)
            
            print(f"Status: {response.status_code}")
            if response.status_code in [200, 201, 204]:
                print("  -> Request succeeded")
            else:
                print(f"  -> Request failed: {response.status_code}")
        except Exception as e:
            print(f"  -> Error: {e}")
        print()

if __name__ == "__main__":
    token = get_token()
    if token:
        test_csrf_with_missing_origin(token)
        test_csrf_with_different_origin(token)
        test_csrf_with_preflight()
        test_csrf_with_referrer(token)
        test_csrf_state_changing_requests(token)