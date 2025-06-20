export CARLIN_DESTROY=true

# Need to run build-config and carlin before deploy because we're using the flag --only.
pnpm turbo run build-config
pnpm turbo run build --filter=carlin --only

pnpm turbo run deploy --only