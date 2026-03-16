#!/usr/bin/env python3
"""
XSS Test Script v2
Tests the frontend for XSS vulnerabilities with a valid user
"""

import requests

FRONTEND_URL = "http://localhost:3002"
BASE_URL = "http://localhost:8080"

def test_xss_in_event_creation():
    """Test XSS in event creation"""
    print("Testing XSS in event creation...")
    
    # Get a valid token
    try:
        login_response = requests.post(f"{BASE_URL}/login", json={
            "email": "test2@example.com",
            "password": "SecurePass123!"
        })
        if login_response.status_code == 200:
            token = login_response.json().get("token")
            print(f"Got token: {token[:20]}...")
        else:
            print("Could not get token")
            return
    except Exception as e:
        print(f"Error getting token: {e}")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    xss_payloads = [
        "<script>alert('XSS')</script>",
        "<img src=x onerror=alert('XSS')>",
        "<svg onload=alert('XSS')>",
    ]
    
    for payload in xss_payloads:
        try:
            print(f"Testing payload: {payload}")
            event_data = {
                "title": payload,
                "description": "Test event with XSS",
                "event_date": "2026-12-31T23:59:59Z",
                "latitude": 55.7558,
                "longitude": 37.6173,
                "is_free": True,
            }
            response = requests.post(f"{BASE_URL}/events", json=event_data, headers=headers)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 201:
                # Get the event back
                event_id = response.json().get("event", {}).get("id")
                if event_id:
                    get_response = requests.get(f"{BASE_URL}/events/{event_id}")
                    if payload in get_response.text:
                        print("  -> XSS payload stored and reflected in API!")
                    else:
                        print("  -> Payload not reflected in API response")
                        
                    # Also check frontend rendering
                    frontend_response = requests.get(f"{FRONTEND_URL}/")
                    if payload in frontend_response.text:
                        print("  -> XSS payload reflected in frontend!")
                    else:
                        print("  -> Payload not reflected in frontend")
            else:
                print(f"  -> Event creation failed: {response.text}")
        except Exception as e:
            print(f"  -> Error: {e}")
        print()

if __name__ == "__main__":
    test_xss_in_event_creation()