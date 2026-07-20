#!/bin/bash
# Setup script to configure Node.js version for this session

REPO=/home/user/ttoss
NODE_DIR=/opt/node24
NODE_VERSION=v24.18.0

# 1) Garante Node 24. O ambiente traz apenas /opt/node22 e NÃO tem nvm,
#    então baixamos o binário oficial em vez de depender de um version manager.
node_major="$(node --version 2>/dev/null | sed 's/v\([0-9]*\).*/\1/')"
if [ "${node_major:-0}" -lt 24 ]; then
  if [ ! -x "${NODE_DIR}/bin/node" ]; then
    echo "Node ${node_major:-none} < 24; instalando ${NODE_VERSION}..."
    TARBALL="node-${NODE_VERSION}-linux-x64.tar.xz"
    curl -fsSL "https://nodejs.org/dist/${NODE_VERSION}/${TARBALL}" -o "/tmp/${TARBALL}"
    mkdir -p "${NODE_DIR}"
    tar -xJf "/tmp/${TARBALL}" -C "${NODE_DIR}" --strip-components=1
    rm -f "/tmp/${TARBALL}"
  fi
  export PATH="${NODE_DIR}/bin:${PATH}"
fi

# Torna o Node 24 padrão em TODO shell futuro que o Claude abrir
# (o /opt/node22 vem primeiro no PATH por default).
grep -q '# claude-node24' "$HOME/.bashrc" 2>/dev/null || \
  echo 'export PATH="/opt/node24/bin:$PATH" # claude-node24' >> "$HOME/.bashrc"

corepack enable >/dev/null 2>&1 || true
echo "Usando node $(node --version), pnpm $(pnpm --version)"

# 2) Dependências (clones novos começam sem node_modules).
cd "$REPO"
pnpm install --frozen-lockfile

# 3) Builda os pacotes de config para lint/syncpack/tests resolverem
#    @ttoss/config, depois extrai/compila i18n (CLAUDE.md: "required before first run").
pnpm turbo run build-config
pnpm -w run i18n

# This ensures Node 24.18.0 is used instead of Node 22

# Check if Node 24 is available
if [ -x "/opt/node24/bin/node" ]; then
  # Prepend node24 to PATH to prioritize it
  export PATH="/opt/node24/bin:${PATH}"

  # Also update the /usr/local/bin/node symlink for global availability
  if [ -L "/usr/local/bin/node" ]; then
    rm -f /usr/local/bin/node
  fi
  ln -sf /opt/node24/bin/node /usr/local/bin/node

  echo "Setup complete: node $(node --version), pnpm $(pnpm --version)"
else
  echo "Warning: Node 24 not found at /opt/node24/bin/node"
  echo "Using default: node $(node --version), pnpm $(pnpm --version)"
fi
