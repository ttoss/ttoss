#!/bin/bash
# pre-pr-check.sh

set -e

echo "🔍 Running pre-PR checks..."
echo ""

echo "1️⃣ Checking formatting..."
pnpm run format:check || {
    echo "❌ Format check failed. Run: pnpm run format"
    exit 1
}

echo ""
echo "2️⃣ Running linter..."
pnpm run lint || {
    echo "❌ Lint failed. Run: pnpm run lint:fix"
    exit 1
}

echo ""
echo "3️⃣ Type checking..."
pnpm turbo run type-check || {
    echo "❌ Type check failed"
    exit 1
}

echo ""
echo "4️⃣ Building packages..."
pnpm turbo run build || {
    echo "❌ Build failed"
    exit 1
}

echo ""
echo "5️⃣ Running tests..."
pnpm turbo run test || {
    echo "❌ Tests failed"
    exit 1
}

echo ""
echo "✅ All checks passed! Ready for PR."