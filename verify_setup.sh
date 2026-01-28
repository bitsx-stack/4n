#!/bin/bash

# Mobile App Setup Verification Script
# This script checks if everything is configured correctly

echo "=========================================="
echo "Mobile App Setup Verification"
echo "=========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Node.js installed
echo "[1] Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js installed: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js not found. Please install Node.js v16+"
    exit 1
fi

# Check 2: npm installed
echo "[2] Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓${NC} npm installed: v$NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm not found"
    exit 1
fi

# Check 3: Mobile folder exists
echo "[3] Checking mobile folder..."
if [ -d "./mobile" ]; then
    echo -e "${GREEN}✓${NC} mobile/ directory found"
else
    echo -e "${RED}✗${NC} mobile/ directory not found"
    exit 1
fi

# Check 4: package.json exists
echo "[4] Checking package.json..."
if [ -f "./mobile/package.json" ]; then
    echo -e "${GREEN}✓${NC} package.json found"
else
    echo -e "${RED}✗${NC} package.json not found in mobile/"
    exit 1
fi

# Check 5: Required dependencies in package.json
echo "[5] Checking required dependencies..."
if grep -q "axios" ./mobile/package.json; then
    echo -e "${GREEN}✓${NC} axios found in dependencies"
else
    echo -e "${YELLOW}⚠${NC} axios not found - run: cd mobile && npm install axios"
fi

if grep -q "@react-native-async-storage/async-storage" ./mobile/package.json; then
    echo -e "${GREEN}✓${NC} async-storage found in dependencies"
else
    echo -e "${YELLOW}⚠${NC} async-storage not found - run: cd mobile && npm install @react-native-async-storage/async-storage"
fi

# Check 6: Required files exist
echo "[6] Checking required files..."
required_files=(
    "mobile/util/api.ts"
    "mobile/context/auth_context.tsx"
    "mobile/reducer/auth_reducer.tsx"
    "mobile/app/screens/Login.tsx"
    "mobile/app/screens/StoreSelection.tsx"
    "mobile/app/screens/BrandModelSelection.tsx"
    "mobile/app/screens/StockTakingScreen.tsx"
    "mobile/app/screens/Navigation.tsx"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file NOT FOUND"
    fi
done

# Check 7: API configuration
echo "[7] Checking API configuration..."
if grep -q "API_BASE_URL" ./mobile/util/api.ts; then
    API_URL=$(grep "API_BASE_URL" ./mobile/util/api.ts | head -1)
    echo -e "${YELLOW}⚠${NC} Found: $API_URL"
    echo "    Make sure to update this with your backend URL!"
else
    echo -e "${RED}✗${NC} API_BASE_URL not found in util/api.ts"
fi

# Check 8: Backend status
echo "[8] Checking backend API..."
if command -v curl &> /dev/null; then
    # Try common localhost addresses
    if curl -s http://localhost:8000/api/stores > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Backend API accessible at http://localhost:8000"
    elif curl -s http://127.0.0.1:8000/api/stores > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Backend API accessible at http://127.0.0.1:8000"
    else
        echo -e "${YELLOW}⚠${NC} Backend API not accessible at localhost:8000"
        echo "    Make sure backend is running: python -m uvicorn app.main:app --reload"
    fi
else
    echo -e "${YELLOW}⚠${NC} curl not available - cannot check backend"
fi

# Check 9: Backend Python setup
echo "[9] Checking backend Python setup..."
if [ -f "./backend/requirements.txt" ]; then
    echo -e "${GREEN}✓${NC} backend/requirements.txt found"
    if command -v python &> /dev/null; then
        PYTHON_VERSION=$(python --version 2>&1)
        echo -e "${GREEN}✓${NC} Python installed: $PYTHON_VERSION"
    else
        echo -e "${YELLOW}⚠${NC} Python not found - backend may not be available"
    fi
else
    echo -e "${RED}✗${NC} backend/requirements.txt not found"
fi

# Check 10: Documentation
echo "[10] Checking documentation..."
docs=(
    "MOBILE_QUICK_START.md"
    "MOBILE_SETUP_GUIDE.md"
    "IMPLEMENTATION_SUMMARY.md"
)

for doc in "${docs[@]}"; do
    if [ -f "./$doc" ]; then
        echo -e "${GREEN}✓${NC} $doc"
    else
        echo -e "${YELLOW}⚠${NC} $doc not found"
    fi
done

# Summary
echo ""
echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo ""
echo "To get started:"
echo "1. Update API URL in mobile/util/api.ts"
echo "2. Install dependencies: cd mobile && npm install"
echo "3. Start backend: cd backend && python -m uvicorn app.main:app --reload"
echo "4. Run mobile app: cd mobile && npm start"
echo ""
echo "For detailed setup instructions, see:"
echo "  - MOBILE_QUICK_START.md"
echo "  - MOBILE_SETUP_GUIDE.md"
echo ""
echo "=========================================="
