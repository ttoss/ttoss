# Build config to run lint-staged for lint and version bump
yarn turbo run build --filter=@ttoss/config...

# Lint
turbo run lint

# Build all packages since main and their dependencies
# https://turbo.build/repo/docs/core-concepts/monorepos/filtering#include-dependencies-of-matched-workspaces
turbo run build --filter=[main]...

# Test and deploy all packages since main and their dependent packages
# https://turbo.build/repo/docs/core-concepts/monorepos/filtering#include-dependencies-of-matched-workspaces
yarn turbo test deploy --filter=...[main]
