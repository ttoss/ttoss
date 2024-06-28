export CARLIN_DESTROY=true

pnpm run build:config

# Need to run build carlin before deploy because we're using the flag --only.
pnpm turbo run build --filter=carlin --only

pnpm turbo run deploy --only