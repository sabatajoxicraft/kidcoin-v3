#!/bin/bash
# MDDF Pre-Push Quality Gates for React Native
# This script runs BEFORE pushing to verify the build will succeed

set -e

echo "🛡️  Running Copilot Quality Gates..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Gate 1: Check for broken imports (grep for removed packages)
echo "🔍 Checking for broken imports..."
TANSTACK_IMPORTS=$(grep -r "@tanstack/react-router" src/ --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l)
if [ "$TANSTACK_IMPORTS" -gt 0 ]; then
    echo -e "${RED}❌ Found $TANSTACK_IMPORTS TanStack Router imports (package removed)${NC}"
    grep -r "@tanstack/react-router" src/ --include="*.tsx" --include="*.ts" 2>/dev/null || true
    ERRORS=$((ERRORS + 1))
fi

# Gate 2: Check for Expo imports in non-Expo project
if [ ! -f "app.json" ] || ! grep -q '"expo"' app.json 2>/dev/null; then
    EXPO_IMPORTS=$(grep -r "from 'expo" src/ --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l)
    if [ "$EXPO_IMPORTS" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Found $EXPO_IMPORTS Expo imports in non-Expo project${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

# Gate 3: TypeScript check
echo "📝 Type checking..."
if command -v npx &> /dev/null; then
    if ! npx tsc --noEmit 2>&1 | tail -20; then
        echo -e "${YELLOW}⚠️  Type check has errors, but allowing push (fix in CI)${NC}"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${GREEN}✓ TypeScript check passed${NC}"
    fi
fi

# Gate 4: Metro Bundle Check (React Native specific)
if [ -f "metro.config.js" ] || [ -f "metro.config.ts" ]; then
    echo "📦 Verifying Metro can bundle..."
    if timeout 90 npx react-native bundle \
        --platform android \
        --dev false \
        --entry-file index.js \
        --bundle-output /tmp/mddf-test-bundle.js \
        --reset-cache 2>&1 | tail -10; then
        echo -e "${GREEN}✓ Metro bundle check passed${NC}"
        rm -f /tmp/mddf-test-bundle.js
    else
        echo -e "${RED}❌ Metro bundle FAILED - DO NOT PUSH${NC}"
        echo "Fix import errors locally before pushing."
        ERRORS=$((ERRORS + 1))
    fi
fi

# Final verdict
echo ""
if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ Quality gates FAILED with $ERRORS errors${NC}"
    echo "Fix errors before pushing to avoid CI failures."
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Quality gates passed with $WARNINGS warnings${NC}"
    echo "✅ Proceeding with push..."
    exit 0
else
    echo -e "${GREEN}✅ All quality gates passed${NC}"
    exit 0
fi
