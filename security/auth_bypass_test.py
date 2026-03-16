#!/usr/bin/env python3
"""
Authentication Bypass Test Script
Tests the backend API for authentication bypass vulnerabilities
"""

import requests
import json

BASE_URL = "http://localhost:8080"

def test_missing_auth():
    """Test accessing protected endpoints without auth"""
    print("Testing missing authentication...")
    
    endpoints = [
        ("GET", f"{BASE_URL}/profile"),
        ("GET", f"{BASE_URL}/events/user"),
        ("POST", f"{BASE_URL}/events"),
        ("GET", f"{BASE_URL}/friends"),
    ]
    
    for method, url in endpoints:
        try:
            print(f"Testing {method} {url}")
            if method == "GET":
                response = requests.get(url)
            else:
                response = requests.post(url, json={})
            
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                print("  -> VULNERABILITY: Access granted without authentication!")
            else:
                print("  -> OK: Access denied")
        except Exception as e:
            print(f"  -> Error: {e}")
        print()

def test_invalid_token():
    """Test accessing with invalid/expired token"""
    print("Testing with invalid token...")
    
    fake_tokens = [
        "invalid_token",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxfQ.invalid",
        "Bearer invalid_token",
    ]
    
    for token in fake_tokens:
        headers = {"Authorization": token}
        try:
            print(f"Testing with token: {token[:30]}...")
            response = requests.get(f"{BASE_URL}/profile", headers=headers)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                print("  -> VULNERABILITY: Access granted with invalid token!")
            else:
                print("  -> OK: Access denied")
        except Exception as e:
            print(f"  -> Error: {e}")
        print()

def test_token_leakage():
    """Test if tokens are leaked in error messages"""
    print("Testing for token leakage in error messages...")
    
    # Try to trigger various errors
    error_scenarios = [
        ("GET", f"{BASE_URL}/events/999999999", {}),  # Non-existent event
        ("POST", f"{BASE_URL}/login", {"email": "nonexistent@example.com", "password": "wrong"}),
    ]
    
    for method, url, data in error_scenarios:
        try:
            print(f"Testing {method} {url}")
            if method == "GET":
                response = requests.get(url)
            else:
                response = requests.post(url, json=data)
            
            print(f"Status: {response.status_code}")
            response_text = response.text.lower()
            if "token" in response_text or "jwt" in response_text or "bearer" in response_text:
                print("  -> POTENTIAL LEAKAGE: Token information found in response!")
            else:
                print("  -> OK: No token information in response")
        except Exception as e:
            print(f"  -> Error: {e}")
        print()

def test_rate_limiting():
    """Test if rate limiting is implemented"""
    print("Testing rate limiting...")
    
    # Try rapid login attempts
    print("Making 10 rapid login attempts...")
    success_count = 0
    for i in range(10):
        try:
            response = requests.post(f"{BASE_URL}/login", json={
                "email": f"test{i}@example.com",
                "password": "wrongpassword"
            })
            if response.status_code != 429:  # 429 = Too Many Requests
                success_count += 1
        except:
            pass
    
    print(f"Successful requests: {success_count}/10")
    if success_count >= 10:
        print("  -> VULNERABILITY: No rate limiting detected!")
    else:
        print("  -> OK: Rate limiting appears to be in place")
    print()

if __name__ == "__main__":
    test_missing_auth()
    test_invalid_token()
    test_token_leakage()
    test_rate_limiting()