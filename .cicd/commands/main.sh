if [ ! $(yarn lerna changed) ]; then            
  export CARLIN_ENVIRONMENT=Production
  
  LATEST_TAG=$(git describe --tags --abbrev=0)

  # Setup NPM token
  echo //registry.npmjs.org/:\_authToken=${{ secrets.NPM_TOKEN }} > .npmrc

  # Build config to run lint-staged for lint and version bump
  yarn turbo run build --filter=@ttoss/config...

  # Build modified packages for version bump
  yarn turbo run build test lint --filter=[$LATEST_TAG]

  # Version before publish to rebuild all packages that Lerna will publish
  yarn lerna version --yes --no-push

  # Rebuild all packages that Lerna will publish
  yarn turbo run build lint test deploy --filter=[$LATEST_TAG]

  # Publish packages
  yarn lerna publish from-git --yes --no-verify-access

  # Push changes
  git push --follow-tags
else
  # Don't publish if there are no changes
  echo "No changed packages. Skipping main workflow."
fi