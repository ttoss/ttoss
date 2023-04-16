export CARLIN_DESTROY=true

# Need to run build carlin before deploy because we're using the flag --only.
pnpm turbo run build --filter=carlin

pnpm turbo run deploy --only