export CARLIN_ENVIRONMENT=Production

LATEST_TAG=$(git describe --tags --abbrev=0)

yarn turbo run build test lint --filter=[$LATEST_TAG]

echo //registry.npmjs.org/:\_authToken=${NPM_TOKEN} > .npmrc

# Build config to run pre-commit hook for the version bump.
yarn turbo run build --filter=@ttoss/config...

# Version before publish to rebuild all packages that Lerna will publish.
yarn lerna version --yes --no-push

# Build all modified packages by Lerna version to not get the error to publish
# without dist or build folder.
yarn turbo run build lint test deploy --filter=[$LATEST_TAG]

yarn lerna publish from-git --yes --no-verify-access

git push --follow-tags