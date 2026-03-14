#!/usr/bin/env python3
"""
Security vulnerability analysis script for Go backend services
"""

import os
import re
import sys
from pathlib import Path

def analyze_go_file(filepath):
    """Analyze a Go file for potential security vulnerabilities"""
    vulnerabilities = []
    
    with open(filepath, 'r') as f:
        content = f.read()
        lines = content.split('\n')
    
    for i, line in enumerate(lines, 1):
        line_num = i
        
        # SQL injection checks
        if 'db.Exec(' in line or 'db.Query(' in line:
            if '+' in line or '%s' in line or '%' in line:
                vulnerabilities.append({
                    'type': 'SQL Injection',
                    'line': line_num,
                    'code': line.strip(),
                    'file': filepath
                })
        
        # Hardcoded secrets
        if 'password' in line.lower() or 'secret' in line.lower() or 'key' in line.lower():
            if '"' in line and ('password' in line.lower() or 'secret' in line.lower() or 'key' in line.lower()):
                if ':=' in line or '=' in line:
                    # Check if it's a hardcoded value
                    if re.search(r'["\'][^"\']*["\']', line) and 'os.Getenv' not in line:
                        vulnerabilities.append({
                            'type': 'Hardcoded Secret',
                            'line': line_num,
                            'code': line.strip(),
                            'file': filepath
                        })
        
        # Path traversal
        if 'filepath.Join' in line or 'os.PathJoin' in line:
            if '+' in line or 'user' in line.lower():
                vulnerabilities.append({
                    'type': 'Potential Path Traversal',
                    'line': line_num,
                    'code': line.strip(),
                    'file': filepath
                })
        
        # Command injection
        if 'exec.Command' in line or 'syscall.Exec' in line:
            if '+' in line or '$' in line:
                vulnerabilities.append({
                    'type': 'Potential Command Injection',
                    'line': line_num,
                    'code': line.strip(),
                    'file': filepath
                })
        
        # Weak crypto
        if 'md5' in line.lower() or 'sha1' in line.lower():
            if 'crypto/md5' in line or 'crypto/sha1' in line:
                vulnerabilities.append({
                    'type': 'Weak Cryptographic Hash',
                    'line': line_num,
                    'code': line.strip(),
                    'file': filepath
                })
        
        # JWT issues
        if 'jwt.' in line and ('None' in line or 'none' in line):
            vulnerabilities.append({
                'type': 'JWT Algorithm None Vulnerability',
                'line': line_num,
                'code': line.strip(),
                'file': filepath
            })
        
        # CORS misconfiguration
        if 'Access-Control-Allow-Origin' in line and '*' in line:
            vulnerabilities.append({
                'type': 'Overly Permissive CORS',
                'line': line_num,
                'code': line.strip(),
                'file': filepath
            })
    
    return vulnerabilities

def analyze_directory(directory):
    """Analyze all Go files in a directory"""
    vulnerabilities = []
    go_files = list(Path(directory).rglob('*.go'))
    
    for go_file in go_files:
        if 'test' in str(go_file).lower():
            continue
        vulns = analyze_go_file(str(go_file))
        vulnerabilities.extend(vulns)
    
    return vulnerabilities

def main():
    """Main function"""
    print("Analyzing Go backend services for security vulnerabilities...")
    
    backend_dir = "/home/bobrcurva/Desktop/screen-rotation/backend"
    vulnerabilities = analyze_directory(backend_dir)
    
    if vulnerabilities:
        print(f"\nFound {len(vulnerabilities)} potential security issues:")
        print("=" * 80)
        
        for vuln in vulnerabilities:
            print(f"Type: {vuln['type']}")
            print(f"File: {vuln['file']}")
            print(f"Line: {vuln['line']}")
            print(f"Code: {vuln['code']}")
            print("-" * 80)
    else:
        print("No obvious security vulnerabilities detected in the code.")
    
    # Write report to file
    with open("/home/bobrcurva/Desktop/screen-rotation/security/vulnerability_report.txt", "w") as f:
        f.write(f"Security Vulnerability Analysis Report\n")
        f.write(f"Generated: {os.popen('date').read()}\n")
        f.write(f"Total vulnerabilities found: {len(vulnerabilities)}\n")
        f.write("=" * 80 + "\n\n")
        
        for vuln in vulnerabilities:
            f.write(f"Type: {vuln['type']}\n")
            f.write(f"File: {vuln['file']}\n")
            f.write(f"Line: {vuln['line']}\n")
            f.write(f"Code: {vuln['code']}\n")
            f.write("-" * 80 + "\n\n")

if __name__ == "__main__":
    main()