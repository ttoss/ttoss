#!/bin/bash
# pre-pr-check.sh

set -e

echo "🔍 Running pre-PR checks..."
echo ""

echo "1️⃣ Running linter..."
pnpm -w lint || {
    echo "❌ Lint failed"
    exit 1
}

echo ""
echo "2️⃣ Type checking..."
pnpm turbo run type-check || {
    echo "❌ Type check failed"
    exit 1
}

echo ""
echo "3️⃣ Building packages..."
pnpm turbo run build || {
    echo "❌ Build failed"
    exit 1
}

echo ""
echo "4️⃣ Running tests..."
pnpm turbo run test || {
    echo "❌ Tests failed"
    exit 1
}

echo ""
echo "✅ All checks passed! Ready for PR."