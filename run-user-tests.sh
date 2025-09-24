#!/bin/bash

# User Management Contract Tests Runner
# This script runs all user management contract tests

echo "🚀 Running User Management Contract Tests"
echo "============================================"

# Set test environment variables
export NODE_ENV=test
export JWT_SECRET=test-secret-key-for-testing
export TEST_DB_URL=postgresql://test:test@localhost:5432/test_db

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Running User Management Tests...${NC}"
echo ""

# Test categories
TEST_CATEGORIES=(
    "CRUD Operations"
    "Role Management"
    "User Lifecycle"
    "Profile Management"
    "Pagination & Filtering"
    "Security & Compliance"
)

# Function to run tests for a specific category
run_category_tests() {
    local category=$1
    local test_file=$2

    echo -e "${YELLOW}🧪 Testing ${category}...${NC}"

    # Run tests with coverage
    npx jest "$test_file" \
        --config "/home/mohamed/sho/tests/jest.users.config.js" \
        --coverage \
        --verbose \
        --testTimeout=30000 \
        --forceExit

    local exit_code=$?

    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ ${category} tests passed${NC}"
    else
        echo -e "${RED}❌ ${category} tests failed${NC}"
    fi

    echo ""
    return $exit_code
}

# Track overall success
OVERALL_SUCCESS=0

# Run tests for each category
echo -e "${BLUE}📊 Running All Test Categories${NC}"
echo "========================================"

# Run all user tests at once
echo -e "${YELLOW}🧪 Running Complete User Management Test Suite...${NC}"
npx jest "/home/mohamed/sho/tests/contracts/users" \
    --config "/home/mohamed/sho/tests/jest.users.config.js" \
    --coverage \
    --verbose \
    --testTimeout=30000 \
    --forceExit

OVERALL_SUCCESS=$?

# Generate test report
echo ""
echo -e "${BLUE}📊 Test Report Summary${NC}"
echo "========================================"

if [ $OVERALL_SUCCESS -eq 0 ]; then
    echo -e "${GREEN}🎉 All User Management Tests Passed!${NC}"
    echo ""
    echo -e "${BLUE}📈 Coverage Report${NC}"
    echo "Coverage report generated in: coverage/users/"
    echo ""
    echo -e "${BLUE}🔍 Test Categories Covered:${NC}"
    for category in "${TEST_CATEGORIES[@]}"; do
        echo -e "  ✅ ${category}"
    done
    echo ""
    echo -e "${BLUE}📝 Test Files:${NC}"
    echo "  📄 CRUD Operations - crud.contract.test.ts"
    echo "  📄 Role Management - role-management.contract.test.ts"
    echo "  📄 User Lifecycle - lifecycle.contract.test.ts"
    echo "  📄 Profile Management - profile.contract.test.ts"
    echo "  📄 Pagination & Filtering - pagination-filtering.contract.test.ts"
    echo "  📄 Security & Compliance - security-compliance.contract.test.ts"
    echo ""
    echo -e "${GREEN}🚀 Ready for Production!${NC}"
else
    echo -e "${RED}❌ Some Tests Failed${NC}"
    echo ""
    echo -e "${YELLOW}🔧 Debug Steps:${NC}"
    echo "  1. Check the test output above for specific failures"
    echo "  2. Review test data and mock configurations"
    echo "  3. Verify API endpoint implementations"
    echo "  4. Check database connectivity and schema"
    echo ""
    echo -e "${BLUE}📊 Run Individual Categories:${NC}"
    echo "  npm run test:users:crud"
    echo "  npm run test:users:roles"
    echo "  npm run test:users:lifecycle"
    echo "  npm run test:users:profile"
    echo "  npm run test:users:pagination"
    echo "  npm run test:users:security"
    echo ""
    echo -e "${YELLOW}💡 Tips:${NC}"
    echo "  - Run with --verbose for detailed output"
    echo "  - Check coverage/users/lcov-report/index.html for detailed coverage"
    echo "  - Review logs in test output for debugging information"
fi

echo ""
echo "========================================"
echo "User Management Test Suite Complete"
echo "========================================"

exit $OVERALL_SUCCESS