#!/bin/bash
# MDDF Pre-Push Quality Gates for Expo React Native
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

# Gate 2: Lint
echo "🧹 Linting..."
if ! yarn -s lint; then
    echo -e "${RED}❌ Lint failed${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ Lint passed${NC}"
fi

# Gate 3: TypeScript check
echo "📝 Type checking..."
if ! yarn -s typecheck; then
    echo -e "${RED}❌ Type check failed${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ TypeScript check passed${NC}"
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
