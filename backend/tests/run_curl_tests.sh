#!/bin/bash

# Curl Test Runner for Backend Services
# This script reads curl commands from curl_commands.json and executes them

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JSON_FILE="$SCRIPT_DIR/curl_commands.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if jq is installed
check_jq() {
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}Error: jq is required. Install with: brew install jq (macOS) or sudo apt-get install jq (Linux)${NC}"
        exit 1
    fi
}

# Print colored output
print_header() {
    echo -e "\n${GREEN}=========================================${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}=========================================${NC}\n"
}

print_test() {
    echo -e "${YELLOW}Running: $1${NC}"
}

print_result() {
    local status="$1"
    local expected="$2"
    local output="$3"
    
    echo "  Status: $status"
    
    if echo "$output" | grep -qi "error\|invalid\|failed\|cannot\|unable"; then
        echo -e "  ${RED}Error detected in response${NC}"
    fi
    
    if [ -n "$expected" ] && [ "$status" = "$expected" ]; then
        echo -e "  ${GREEN}✓ Expected status code${NC}"
    fi
    echo ""
}

# Check if a service is running
check_service() {
    local name="$1"
    local url="$2"
    
    echo -n "$name: "
    if curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null | grep -qE "^[0-9]+$"; then
        echo -e "${GREEN}Running${NC}"
        return 0
    else
        echo -e "${RED}Not running${NC}"
        return 1
    fi
}

# Check all services
check_all_services() {
    print_header "Checking Services"
    
    local services=(
        "User Service:http://localhost:8081"
        "Event Service:http://localhost:8082"
        "Message Service:http://localhost:8083"
    )
    
    local all_running=0
    for service in "${services[@]}"; do
        local name="${service%%:*}"
        local url="${service##*:}"
        check_service "$name" "$url" || all_running=1
    done
    
    return $all_running
}

# Get test count for a service
get_test_count() {
    local tests_key="$1"
    jq ".$tests_key | length" "$JSON_FILE"
}

# Get test name
get_test_name() {
    local tests_key="$1"
    local index="$2"
    jq -r ".$tests_key[$index].name" "$JSON_FILE"
}

# Get curl command
get_curl_cmd() {
    local tests_key="$1"
    local index="$2"
    jq -r ".$tests_key[$index].curl" "$JSON_FILE"
}

# Run a single test
run_single_test() {
    local test_name="$1"
    local curl_cmd="$2"
    local expected_status="$3"
    
    print_test "$test_name"
    
    local output
    local status_code
    
    output=$(eval "$curl_cmd" 2>&1) || true
    status_code=$(echo "$output" | grep -oP 'HTTP/[0-9.]+ \K[0-9]+' | head -1) || status_code="000"
    
    print_result "$status_code" "$expected_status" "$output"
}

# Run all tests for a service (sequential)
run_service_sequential() {
    local service_name="$1"
    local tests_key="$2"
    
    print_header "Testing: $service_name"
    
    local test_count
    test_count=$(get_test_count "$tests_key")
    echo "Found $test_count tests"
    echo ""
    
    for i in $(seq 0 $((test_count - 1))); do
        local test_name
        local curl_cmd
        
        test_name=$(get_test_name "$tests_key" "$i")
        curl_cmd=$(get_curl_cmd "$tests_key" "$i")
        
        run_single_test "$test_name" "$curl_cmd" ""
    done
}

# Run all tests for a service (parallel with limit)
run_service_parallel() {
    local service_name="$1"
    local tests_key="$2"
    local max_parallel="${3:-5}"
    
    print_header "Testing: $service_name"
    
    local test_count
    test_count=$(get_test_count "$tests_key")
    echo "Found $test_count tests (running $max_parallel at a time)"
    echo ""
    
    local pids=()
    local current=0
    
    for i in $(seq 0 $((test_count - 1))); do
        local test_name
        local curl_cmd
        
        test_name=$(get_test_name "$tests_key" "$i")
        curl_cmd=$(get_curl_cmd "$tests_key" "$i")
        
        (
            run_single_test "$test_name" "$curl_cmd" ""
        ) &
        
        pids+=($!)
        current=$((current + 1))
        
        if [ $((current % max_parallel)) -eq 0 ]; then
            for pid in "${pids[@]}"; do
                wait $pid 2>/dev/null || true
            done
            pids=()
        fi
    done
    
    for pid in "${pids[@]}"; do
        wait $pid 2>/dev/null || true
    done
}

# Run all services tests
run_all_services() {
    check_all_services || {
        echo -e "\n${RED}Please start all services before running tests.${NC}"
        return 1
    }
    
    run_service_parallel "User Service" "user_service_tests" 5
    run_service_parallel "Event Service" "event_service_tests" 5
    run_service_parallel "Message Service" "message_service_tests" 5
    
    echo -e "\n${GREEN}All tests completed!${NC}"
}

# Main usage function
show_usage() {
    echo "Usage: $0 [option]"
    echo ""
    echo "Options:"
    echo "  (none)           Run all tests after checking services"
    echo "  user             Test only user-service"
    echo "  event            Test only event-service"
    echo "  message          Test only message-service"
    echo "  check            Check if services are running"
    echo "  all              Run all services tests (skip check)"
    echo "  help             Show this help message"
}

# Main function
main() {
    check_jq
    
    case "${1:-check}" in
        user)
            check_all_services
            run_service_sequential "User Service" "user_service_tests"
            ;;
        event)
            check_all_services
            run_service_sequential "Event Service" "event_service_tests"
            ;;
        message)
            check_all_services
            run_service_sequential "Message Service" "message_service_tests"
            ;;
        check)
            check_all_services
            ;;
        all)
            run_all_services
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            check_all_services
            read -p "Run all tests? (y/n) " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                run_all_services
            fi
            ;;
    esac
}

main "$@"
