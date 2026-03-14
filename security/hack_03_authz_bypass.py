#!/usr/bin/env python3
"""
Authorization Bypass Hack Script
Tests for Insecure Direct Object Reference (IDOR) and authorization vulnerabilities
"""

import os
import requests
import json
import sys
import time

# Get the directory of this script for portable paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

class AuthorizationBypassHacker:
    def __init__(self, base_urls):
        self.base_urls = base_urls
        self.findings = []
        self.user1_token = None
        self.user2_token = None
        self.user1_id = None
        self.user2_id = None
        
    def create_test_users(self):
        """Create two test users for authorization testing"""
        user_service = self.base_urls.get('user_service', 'http://localhost:8081')
        
        # Create user 1
        try:
            response = requests.post(f"{user_service}/register", json={
                "email": f"user1_{int(time.time())}@example.com",
                "username": f"user1_{int(time.time())}",
                "password": "Password123!",
                "first_name": "User",
                "last_name": "One",
                "age": 25
            }, timeout=5)
            
            if response.status_code == 201:
                data = response.json()
                self.user1_token = data.get('token')
                self.user1_id = data.get('user', {}).get('id')
        except Exception as e:
            print(f"[-] Error creating user1: {e}")
        
        time.sleep(0.5)
        
        # Create user 2
        try:
            response = requests.post(f"{user_service}/register", json={
                "email": f"user2_{int(time.time())}@example.com",
                "username": f"user2_{int(time.time())}",
                "password": "Password123!",
                "first_name": "User",
                "last_name": "Two",
                "age": 30
            }, timeout=5)
            
            if response.status_code == 201:
                data = response.json()
                self.user2_token = data.get('token')
                self.user2_id = data.get('user', {}).get('id')
        except Exception as e:
            print(f"[-] Error creating user2: {e}")
    
    def test_idor_profile_access(self):
        """Test IDOR on profile access"""
        print("[*] Testing IDOR on profile endpoint")
        user_service = self.base_urls.get('user_service', 'http://localhost:8081')
        
        if not self.user1_token:
            print("[-] No valid token, skipping IDOR test")
            return
        
        # Try to access user1's profile with user2's token
        endpoints = [
            f"{user_service}/profile",
            f"{user_service}/users/1",
            f"{user_service}/users/2",
            f"{user_service}/users/999",
        ]
        
        for endpoint in endpoints:
            try:
                headers = {"Authorization": f"Bearer {self.user1_token}"}
                response = requests.get(endpoint, headers=headers, timeout=5)
                
                # If we can access other user's data, it's vulnerable
                if response.status_code == 200:
                    try:
                        data = response.json()
                        user_id = None
                        if isinstance(data, dict):
                            user_id = data.get('user', {}).get('id') or data.get('id')
                        
                        if user_id and str(user_id) != str(self.user1_id):
                            self.findings.append({
                                "type": "IDOR - Profile Access",
                                "endpoint": endpoint,
                                "description": f"User 1 (ID: {self.user1_id}) can access User {user_id}'s profile",
                                "response": response.status_code
                            })
                            print(f"  [!] VULNERABLE - Can access user {user_id}'s profile!")
                    except (ValueError, AttributeError):
                        pass
            except requests.RequestException:
                pass
    
    def test_idor_friends_list(self):
        """Test IDOR on friends list"""
        print("[*] Testing IDOR on friends list")
        user_service = self.base_urls.get('user_service', 'http://localhost:8081')
        
        if not self.user1_token:
            return
        
        endpoints = [
            f"{user_service}/friends",
            f"{user_service}/friends/1",
            f"{user_service}/friends/2",
        ]
        
        for endpoint in endpoints:
            try:
                headers = {"Authorization": f"Bearer {self.user1_token}"}
                response = requests.get(endpoint, headers=headers, timeout=5)
                
                # Only flag as IDOR if accessing OTHER users' friends lists
                if response.status_code == 200 and "/friends/" in endpoint:
                    self.findings.append({
                        "type": "IDOR - Friends List",
                        "endpoint": endpoint,
                        "description": "Can access another user's friends list",
                        "response": response.status_code
                    })
                    print(f"  [!] VULNERABLE - Can access friends list at {endpoint}")
            except requests.RequestException:
                pass
    
    def test_idor_friend_request(self):
        """Test IDOR on friend requests"""
        print("[*] Testing IDOR on friend requests")
        user_service = self.base_urls.get('user_service', 'http://localhost:8081')
        
        if not self.user1_token or not self.user2_token:
            return
        
        # Try to accept/reject friend requests that don't belong to us
        endpoints = [
            f"{user_service}/friends/request/1/accept",
            f"{user_service}/friends/request/1/reject",
            f"{user_service}/friends/request/999/accept",
            f"{user_service}/friends/request/999/reject",
        ]
        
        for endpoint in endpoints:
            try:
                headers = {"Authorization": f"Bearer {self.user1_token}"}
                response = requests.put(endpoint, headers=headers, timeout=5)
                
                # If not properly rejected, might be vulnerable
                if response.status_code != 403 and response.status_code != 404:
                    self.findings.append({
                        "type": "IDOR - Friend Request Manipulation",
                        "endpoint": endpoint,
                        "description": "Can manipulate friend requests without ownership",
                        "response": response.status_code
                    })
                    print(f"  [!] Potential vulnerability - Status: {response.status_code}")
            except:
                pass
    
    def test_idor_user_search(self):
        """Test if user search exposes sensitive data"""
        print("[*] Testing excessive data exposure in user search")
        user_service = self.base_urls.get('user_service', 'http://localhost:8081')
        
        if not self.user1_token:
            return
        
        try:
            headers = {"Authorization": f"Bearer {self.user1_token}"}
            response = requests.get(f"{user_service}/users/search?q=test", headers=headers, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if search returns sensitive data
                sensitive_fields = ['password', 'password_hash', 'created_at']
                
                if isinstance(data, list) and len(data) > 0:
                    user = data[0]
                    exposed = [f for f in sensitive_fields if f in user]
                    
                    if exposed:
                        self.findings.append({
                            "type": "Excessive Data Exposure",
                            "endpoint": f"{user_service}/users/search",
                            "description": f"Search exposes sensitive fields: {exposed}",
                            "response": response.status_code
                        })
                        print(f"  [!] VULNERABLE - Exposes: {exposed}")
        except Exception as e:
            print(f"  [-] Error: {e}")
    
    def test_horizontal_privilege_escalation(self):
        """Test if users can access other users' resources"""
        print("[*] Testing horizontal privilege escalation")
        user_service = self.base_urls.get('user_service', 'http://localhost:8081')
        
        if not self.user1_token or not self.user2_token:
            return
        
        # Note: /profile endpoint updates own profile only - this is correct behavior
        # A true horizontal escalation test would need user-specific endpoints
        # For now, verify user can only modify their own profile
        try:
            headers = {"Authorization": f"Bearer {self.user1_token}"}
            response = requests.put(
                f"{user_service}/profile",
                headers=headers,
                json={"first_name": "User1Profile", "last_name": "Test"},
                timeout=5
            )
            
            # This should succeed - user updating their own profile is expected
            if response.status_code == 200:
                self.findings.append({
                    "type": "Profile Update",
                    "endpoint": f"{user_service}/profile",
                    "description": f"User {self.user1_id} can modify their own profile (expected behavior)",
                    "response": response.status_code
                })
                print(f"  [!] Profile update status: {response.status_code}")
        except Exception as e:
            print(f"  [-] Error: {e}")
    
    def test_event_idor(self):
        """Test IDOR on event endpoints"""
        print("[*] Testing IDOR on event endpoints")
        event_service = self.base_urls.get('event_service', 'http://localhost:8082')
        
        if not self.user1_token:
            return
        
        # Try to access events without proper authorization
        endpoints = [
            f"{event_service}/events",
            f"{event_service}/events/1",
            f"{event_service}/events/999",
            f"{event_service}/events/search?q=test",
        ]
        
        for endpoint in endpoints:
            try:
                headers = {"Authorization": f"Bearer {self.user1_token}"}
                response = requests.get(endpoint, headers=headers, timeout=5)
                
                # Check for proper authorization
                if response.status_code == 200:
                    self.findings.append({
                        "type": "IDOR - Event Access",
                        "endpoint": endpoint,
                        "description": "Event data accessible without proper scope check",
                        "response": response.status_code
                    })
            except:
                pass
    
    def test_message_idor(self):
        """Test IDOR on message endpoints"""
        print("[*] Testing IDOR on message endpoints")
        message_service = self.base_urls.get('message_service', 'http://localhost:8083')
        
        if not self.user1_token:
            return
        
        endpoints = [
            f"{message_service}/messages",
            f"{message_service}/messages/1",
            f"{message_service}/groups/1/messages",
            f"{message_service}/groups/999/messages",
        ]
        
        for endpoint in endpoints:
            try:
                headers = {"Authorization": f"Bearer {self.user1_token}"}
                response = requests.get(endpoint, headers=headers, timeout=5)
                
                if response.status_code == 200:
                    self.findings.append({
                        "type": "IDOR - Message Access",
                        "endpoint": endpoint,
                        "description": "Messages accessible without proper ownership check",
                        "response": response.status_code
                    })
                    print(f"  [!] Accessible: {endpoint}")
            except:
                pass
    
    def run_attack(self):
        """Execute authorization bypass attacks"""
        print("\n" + "="*60)
        print("AUTHORIZATION BYPASS HACK ATTACK")
        print("="*60)
        
        print("\n[*] Creating test users...")
        self.create_test_users()
        
        if self.user1_token:
            print(f"[+] User 1 token: {self.user1_token[:30]}...")
        if self.user2_token:
            print(f"[+] User 2 token: {self.user2_token[:30]}...")
        
        # Run IDOR tests
        self.test_idor_profile_access()
        self.test_idor_friends_list()
        self.test_idor_friend_request()
        self.test_idor_user_search()
        self.test_horizontal_privilege_escalation()
        self.test_event_idor()
        self.test_message_idor()
        
        print(f"\n[*] Authorization bypass attack completed. Found {len(self.findings)} vulnerabilities.")
        return self.findings


def main():
    base_urls = {
        'user_service': 'http://localhost:8081',
        'event_service': 'http://localhost:8082',
        'message_service': 'http://localhost:8083'
    }
    
    hacker = AuthorizationBypassHacker(base_urls)
    findings = hacker.run_attack()
    
    # Save report - use relative path
    report_file = os.path.join(SCRIPT_DIR, "hack_report_03_authz_bypass.txt")
    with open(report_file, 'w') as f:
        f.write("AUTHORIZATION BYPASS HACK REPORT\n")
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
