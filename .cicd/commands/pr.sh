# Build config to run lint-staged for lint and version bump
yarn turbo run build --filter=@ttoss/config...

# Lint, test, build, and deploy all packages since main and their dependent packages.
# https://turbo.build/repo/docs/core-concepts/monorepos/filtering#include-dependents-of-matched-workspaces
yarn turbo run lint build test deploy --filter=...[main]
