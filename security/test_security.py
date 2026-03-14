#!/usr/bin/env python3
"""
Basic security testing script for the Go backend services
"""

import requests
import json
import sys
import time

def test_cors_policy():
    """Test that CORS policy is properly restricted"""
    print("Testing CORS policy...")
    
    # Test user service
    try:
        response = requests.options('http://localhost:8081/register', 
                                  headers={'Origin': 'http://malicious-site.com'})
        acao = response.headers.get('Access-Control-Allow-Origin')
        if acao == '*':
            print("❌ User Service: CORS still allows wildcard origin")
            return False
        elif acao == 'http://localhost:8080':
            print("✅ User Service: CORS properly restricted to localhost:8080")
        else:
            print(f"⚠️  User Service: CORS set to {acao}")
    except Exception as e:
        print(f"❌ User Service: Error testing CORS: {e}")
        return False
    
    # Test event service
    try:
        response = requests.options('http://localhost:8082/events', 
                                  headers={'Origin': 'http://malicious-site.com'})
        acao = response.headers.get('Access-Control-Allow-Origin')
        if acao == '*':
            print("❌ Event Service: CORS still allows wildcard origin")
            return False
        elif acao == 'http://localhost:8080':
            print("✅ Event Service: CORS properly restricted to localhost:8080")
        else:
            print(f"⚠️  Event Service: CORS set to {acao}")
    except Exception as e:
        print(f"❌ Event Service: Error testing CORS: {e}")
        return False
        
    return True

def test_sql_injection():
    """Test for obvious SQL injection vulnerabilities"""
    print("\nTesting for SQL injection vulnerabilities...")
    
    # Try to register with SQL injection in email
    sql_injection_payload = "' OR '1'='1"
    test_data = {
        "email": sql_injection_payload,
        "username": "testuser",
        "password": "password123",
        "first_name": "Test",
        "last_name": "User",
        "age": 25,
        "is_organizer": False
    }
    
    try:
        response = requests.post('http://localhost:8081/register', 
                               json=test_data,
                               timeout=5)
        # If we get a validation error (not a database error), that's good
        if response.status_code == 400:
            try:
                error_data = response.json()
                if 'error' in error_data:
                    print("✅ User Service: SQL injection attempt properly handled with validation error")
                    return True
            except:
                print("✅ User Service: SQL injection attempt properly handled (non-JSON response)")
                return True
        elif response.status_code == 500:
            print("❌ User Service: Potential SQL injection vulnerability - server error")
            return False
        else:
            print(f"⚠️  User Service: Unexpected response status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ User Service: Error testing SQL injection: {e}")
        return False

def test_jwt_validation():
    """Test JWT token validation"""
    print("\nTesting JWT validation...")
    
    # Try to access protected endpoint without token
    try:
        response = requests.get('http://localhost:8081/profile', timeout=5)
        if response.status_code == 401:
            print("✅ User Service: Protected endpoint properly requires authentication")
            return True
        else:
            print(f"❌ User Service: Protected endpoint accessible without auth (status {response.status_code})")
            return False
    except Exception as e:
        print(f"❌ User Service: Error testing JWT validation: {e}")
        return False

def main():
    """Run all security tests"""
    print("Starting security tests for Go backend services...\n")
    
    # Wait a moment for services to be ready
    time.sleep(2)
    
    tests = [
        test_cors_policy,
        test_sql_injection,
        test_jwt_validation
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test {test.__name__} failed with exception: {e}")
    
    print(f"\n{'='*50}")
    print(f"Security Tests Completed: {passed}/{total} passed")
    
    if passed == total:
        print("🎉 All security tests passed!")
        return 0
    else:
        print("⚠️  Some security tests failed - review needed")
        return 1

if __name__ == "__main__":
    sys.exit(main())