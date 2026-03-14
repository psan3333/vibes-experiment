#!/usr/bin/env python3
"""
Input Validation Hack Script
Tests for input validation vulnerabilities and boundary testing
"""

import os
import requests
import json
import sys

# Get the directory of this script for portable paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

class InputValidationHacker:
    def __init__(self, base_urls):
        self.base_urls = base_urls
        self.findings = []
        
    def test_negative_values(self, url, field, value):
        """Test negative values in numeric fields"""
        print(f"[*] Testing negative value in {field}")
        
        try:
            response = requests.post(url, json={field: value}, timeout=5)
            
            # Check if negative values are accepted when they shouldn't be
            if response.status_code in [200, 201]:
                self.findings.append({
                    "type": "Input Validation - Negative Value Accepted",
                    "url": url,
                    "field": field,
                    "value": value,
                    "response": response.status_code,
                    "severity": "medium"
                })
                print(f"  [!] Accepts negative {field}: {value}")
        except Exception as e:
            pass
    
    def test_extreme_values(self, url, field, value):
        """Test extreme values"""
        print(f"[*] Testing extreme value in {field}")
        
        try:
            response = requests.post(url, json={field: value}, timeout=5)
            
            if response.status_code in [200, 201]:
                self.findings.append({
                    "type": "Input Validation - Extreme Value",
                    "url": url,
                    "field": field,
                    "value": value,
                    "response": response.status_code,
                    "severity": "low"
                })
        except Exception as e:
            pass
    
    def test_special_characters(self, url, fields):
        """Test special characters in input fields"""
        print(f"[*] Testing special characters")
        
        payloads = [
            "<script>alert('xss')</script>",
            "{{{{}}}",  # Template injection
            "${7*7}",
            "<img src=x onerror=alert(1)>",
            "'; DROP TABLE users; --",
            "../../../etc/passwd",
            "%00",  # Null byte
            "\x00\x00\x00",  # Null bytes
        ]
        
        for payload in payloads:
            for field in fields:
                try:
                    response = requests.post(url, json={field: payload}, timeout=5)
                    
                    # Check if payload is reflected or causes error
                    if response.status_code == 500 or payload in response.text:
                        self.findings.append({
                            "type": "Input Validation - Special Characters",
                            "url": url,
                            "field": field,
                            "payload": payload[:50],
                            "response": response.status_code,
                            "evidence": response.text[:100]
                        })
                        print(f"  [!] Special char issue in {field}: {payload[:30]}")
                except:
                    pass
    
    def test_missing_required_fields(self, url, required_fields):
        """Test missing required fields"""
        print(f"[*] Testing missing required fields")
        
        for field in required_fields:
            data = {k: "test" for k in required_fields if k != field}
            
            try:
                response = requests.post(url, json=data, timeout=5)
                
                # Should return 400 but might not
                if response.status_code in [200, 201]:
                    self.findings.append({
                        "type": "Input Validation - Missing Required Field",
                        "url": url,
                        "missing_field": field,
                        "response": response.status_code,
                        "severity": "high"
                    })
                    print(f"  [!] Missing {field} accepted!")
            except:
                pass
    
    def test_invalid_email(self, url):
        """Test invalid email formats"""
        print(f"[*] Testing invalid email formats")
        
        invalid_emails = [
            "notanemail",
            "@nodomain.com",
            "spaces in@email.com",
            "test@.com",
            "test@localhost",
            "a" * 100 + "@test.com",  # Very long
        ]
        
        for email in invalid_emails:
            try:
                response = requests.post(url, json={
                    "email": email,
                    "username": "test",
                    "password": "Password123!",
                    "first_name": "Test",
                    "last_name": "User",
                    "age": 25
                }, timeout=5)
                
                # Check if invalid email is accepted
                if response.status_code in [200, 201]:
                    self.findings.append({
                        "type": "Input Validation - Invalid Email",
                        "url": url,
                        "email": email,
                        "response": response.status_code,
                        "severity": "medium"
                    })
                    print(f"  [!] Invalid email accepted: {email}")
            except:
                pass
    
    def test_weak_password(self, url):
        """Test weak password acceptance"""
        print(f"[*] Testing weak passwords")
        
        weak_passwords = [
            "123",
            "password",
            "123456",
            "abc",
            "a",
            "",  # Empty
        ]
        
        for password in weak_passwords:
            try:
                response = requests.post(url, json={
                    "email": f"test_{password}@example.com",
                    "username": f"test_{password}",
                    "password": password,
                    "first_name": "Test",
                    "last_name": "User",
                    "age": 25
                }, timeout=5)
                
                if response.status_code in [200, 201]:
                    self.findings.append({
                        "type": "Input Validation - Weak Password",
                        "url": url,
                        "password": password,
                        "response": response.status_code,
                        "severity": "high"
                    })
                    print(f"  [!] Weak password accepted: {password}")
            except:
                pass
    
    def test_age_validation(self, url):
        """Test age validation boundaries"""
        print(f"[*] Testing age validation")
        
        invalid_ages = [0, -1, 5, 10, 15, 17, 999, -999]
        
        for age in invalid_ages:
            try:
                response = requests.post(url, json={
                    "email": f"test_{age}@example.com",
                    "username": f"testage_{age}",
                    "password": "Password123!",
                    "first_name": "Test",
                    "last_name": "User",
                    "age": age
                }, timeout=5)
                
                # Should reject underage users (e.g., < 18)
                if response.status_code in [200, 201] and age < 18:
                    self.findings.append({
                        "type": "Input Validation - Underage Acceptance",
                        "url": url,
                        "age": age,
                        "response": response.status_code,
                        "severity": "high"
                    })
                    print(f"  [!] Underage user accepted: {age}")
            except:
                pass
    
    def test_string_length(self, url):
        """Test string length limits"""
        print(f"[*] Testing string length limits")
        
        long_strings = [
            ("first_name", "A" * 1000),
            ("last_name", "B" * 1000),
            ("username", "X" * 100),
            ("email", "a" * 500 + "@test.com"),
            ("bio", "Lorem ipsum" * 1000),
        ]
        
        for field, value in long_strings:
            try:
                response = requests.post(url, json={
                    "email": "testlen@example.com",
                    "username": "testlen",
                    "password": "Password123!",
                    "first_name": "Test",
                    "last_name": "User",
                    "age": 25,
                    field: value
                }, timeout=5)
                
                # Check if very long strings are accepted
                if response.status_code in [200, 201]:
                    self.findings.append({
                        "type": "Input Validation - No Length Limit",
                        "url": url,
                        "field": field,
                        "length": len(value),
                        "response": response.status_code,
                        "severity": "low"
                    })
                    print(f"  [!] No length limit on {field} ({len(value)} chars)")
            except:
                pass
    
    def run_attack(self):
        """Execute input validation attacks"""
        print("\n" + "="*60)
        print("INPUT VALIDATION HACK ATTACK")
        print("="*60)
        
        user_service = self.base_urls.get('user_service', 'http://localhost:8081')
        event_service = self.base_urls.get('event_service', 'http://localhost:8082')
        
        # Test registration validation
        register_url = f"{user_service}/register"
        
        self.test_invalid_email(register_url)
        self.test_weak_password(register_url)
        self.test_age_validation(register_url)
        self.test_string_length(register_url)
        
        # Test event creation validation
        create_event_url = f"{event_service}/events"
        
        self.test_negative_values(create_event_url, "price", -100)
        self.test_negative_values(create_event_url, "max_attendees", -10)
        self.test_negative_values(create_event_url, "latitude", -100)
        self.test_negative_values(create_event_url, "longitude", -200)
        
        self.test_extreme_values(create_event_url, "latitude", 1000)
        self.test_extreme_values(create_event_url, "longitude", 2000)
        
        self.test_special_characters(create_event_url, ["title", "description", "address"])
        
        print(f"\n[*] Input validation attack completed. Found {len(self.findings)} issues.")
        return self.findings


def main():
    base_urls = {
        'user_service': 'http://localhost:8081',
        'event_service': 'http://localhost:8082',
        'message_service': 'http://localhost:8083'
    }
    
    hacker = InputValidationHacker(base_urls)
    findings = hacker.run_attack()
    
    # Save report - use relative path
    report_file = os.path.join(SCRIPT_DIR, "hack_report_04_input_validation.txt")
    with open(report_file, 'w') as f:
        f.write("INPUT VALIDATION HACK REPORT\n")
        f.write("="*60 + "\n\n")
        f.write(f"Total issues found: {len(findings)}\n\n")
        
        for i, finding in enumerate(findings, 1):
            f.write(f"Finding #{i}\n")
            for key, value in finding.items():
                f.write(f"{key}: {value}\n")
            f.write("-"*60 + "\n\n")
    
    print(f"\n[+] Report saved to: {report_file}")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
