# Build @ttoss/config package to lint and sync packages versions
pnpm turbo run build --filter=@ttoss/config --only

# Test, build, and deploy all packages since main
# and all the workspaces that depends on them.
# https://turbo.build/repo/docs/core-concepts/monorepos/filtering#include-dependents-of-matched-workspaces
pnpm turbo run build test deploy --filter=[main]
