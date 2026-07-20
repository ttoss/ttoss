#!/bin/bash
set -euo pipefail

# SessionStart hook for ttoss monorepo
# Ensures Node 24, pnpm, and all dependencies are ready for testing/linting

NODE_VERSION="v24.18.0"
NODE_DIR="/opt/node24"

# 1) Ensure Node 24 is available
node_major="$(node --version 2>/dev/null | sed 's/v\([0-9]*\).*/\1/')" || node_major=0
if [ "${node_major:-0}" -lt 24 ]; then
  if [ ! -x "${NODE_DIR}/bin/node" ]; then
    echo "Installing Node ${NODE_VERSION}..."
    TARBALL="node-${NODE_VERSION}-linux-x64.tar.xz"
    curl -fsSL "https://nodejs.org/dist/${NODE_VERSION}/${TARBALL}" -o "/tmp/${TARBALL}"
    mkdir -p "${NODE_DIR}"
    tar -xJf "/tmp/${TARBALL}" -C "${NODE_DIR}" --strip-components=1
    rm -f "/tmp/${TARBALL}"
  fi
  export PATH="${NODE_DIR}/bin:${PATH}"
fi

# Persist Node 24 in PATH for this session
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo 'export PATH="/opt/node24/bin:$PATH"' >> "$CLAUDE_ENV_FILE"
fi

# 2) Enable corepack for pnpm
corepack enable >/dev/null 2>&1 || true

# 3) Install dependencies (frozen-lockfile ensures reproducibility)
echo "Installing dependencies with pnpm..."
cd "${CLAUDE_PROJECT_DIR:-.}"
pnpm install --frozen-lockfile

# 4) Build config packages first (required for lint/syncpack/tests)
echo "Building config packages..."
pnpm turbo run build-config

# 5) Extract and compile i18n messages (required before first run)
echo "Compiling i18n..."
pnpm -w run i18n

echo "✓ Setup complete: $(node --version), $(pnpm --version)"
