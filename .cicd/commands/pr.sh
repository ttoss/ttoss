# Lint
pnpm turbo run lint

# Build config to run lint-staged for lint and version bump
pnpm turbo run build --filter=@ttoss/config...

# Test, build, and deploy all packages since main and their dependent packages.
# https://turbo.build/repo/docs/core-concepts/monorepos/filtering#include-dependents-of-matched-workspaces
pnpm turbo run build test deploy --filter=...[main]
