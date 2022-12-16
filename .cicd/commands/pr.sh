# Build config to run lint-staged for lint and version bump
yarn turbo run build --filter=@ttoss/config...

yarn turbo run lint build test deploy --filter=[main]
