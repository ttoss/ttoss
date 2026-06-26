export ENVIRONMENT=Production

# Cache all remote tags once to avoid repeated git ls-remote calls.
REMOTE_TAGS_FULL=$(git ls-remote --tags origin)

# Check if the current HEAD is already tagged on the remote.
HEAD_SHA=$(git rev-parse HEAD)
if echo "$REMOTE_TAGS_FULL" | awk '{print $1}' | grep -q "^$HEAD_SHA$"; then
  echo "There are tags in the current commit, exiting main workflow"
  exit 0
fi

# Extract tag names (excluding peeled annotated-tag objects ^{}).
REMOTE_TAGS=$(echo "$REMOTE_TAGS_FULL" | grep -v '\^{}' | awk '{print $2}' | sed 's|refs/tags/||')

# Find the latest tag name.
export LATEST_TAG=$(echo "$REMOTE_TAGS" | sort -V | tail -1)

# Fetch only that one tag so its commit object exists in the local repo.
# This avoids downloading all tags while still letting turbo resolve the SHA.
git fetch origin "refs/tags/$LATEST_TAG:refs/tags/$LATEST_TAG"

# Now resolve the SHA locally (works for both lightweight and annotated tags).
export LATEST_TAG_SHA=$(git rev-list -n 1 "$LATEST_TAG")

# Setup NPM token.
# Using ~/.npmrc instead of .npmrc because pnpm uses .npmrc and appending
# the token to .npmrc will cause git uncommitted changes error.
echo //registry.npmjs.org/:\_authToken=$NPM_TOKEN > ~/.npmrc

# Print "NPM whoami" to check if the token is valid. Exit if it fails.
NPM_WHOAMI=$(npm whoami) || { echo "Error: npm whoami failed. Check NPM_TOKEN."; exit 1; }
echo "NPM whoami: $NPM_WHOAMI"

# Build @ttoss/config package to lerna version command works properly
# when commiting changes. If we don't build this package, commit will fail
# because pre-commit hook will run syncpack:lint with default config, that
# not works because of package version and "workspace:^" mismatch.
pnpm turbo run build-config

# Check dependencies versions.
pnpm run syncpack:lint

# Publish packages only if there are versioned changes since the last tag.
# Pass --since=$LATEST_TAG explicitly so lerna uses the same baseline the
# rest of this script uses, rather than auto-detecting from the shallow clone
# (fetch-depth: 20). Without --since, lerna cannot find the baseline tag in
# the shallow history and logs "Assuming all packages changed" — a false
# positive that wastes the entire build/test/version pipeline.
if pnpm lerna changed --since=$LATEST_TAG; then
  echo "Changes detected on packages, publishing them..."

  # Run i18n, build, and test BEFORE lerna version so turbo cache is warm.
  # If we ran these after lerna version, every versioned package.json change
  # would bust the turbo input hash, causing all affected packages to rebuild
  # from scratch even when their source code hasn't changed.
  # https://turbo.build/repo/docs/core-concepts/caching#missing-the-cache
  pnpm turbo run i18n build test --filter=[$LATEST_TAG_SHA]

  # Undo all files that were changed by the build command—this happens because
  # the build can change files with different linting rules and `pnpm run lint`
  # fix them.
  #
  # We don't want these changes becaues it will cause
  # turbo cache missing. https://turbo.build/repo/docs/core-concepts/caching#missing-the-cache
  #
  # This command uses the git status --porcelain command to check if there are
  # any modified, untracked, or staged files in the repository. If the output
  # of the command is not empty (-z checks for empty output), it means there are changed files.
  pnpm run lint -- --no-stash --allow-empty
  [ -z "$(git status --porcelain)" ] || { echo "Error: There are changes after build. Please, commit them locally and push again"; git status; exit 1; }

  # Before versioning, verify origin/main hasn't moved since checkout.
  # If it has, a concurrent push is in flight; the next run will handle
  # publishing. Exit 0 (not a failure — this is expected graceful behaviour).
  git fetch origin main
  git diff HEAD origin/main --quiet || { echo "New commits on origin/main detected. Skipping this run — the next workflow run will publish." && exit 0; }

  # Capture existing tags before versioning so we can delete only them afterward,
  # preserving the new tags created by lerna version. Tags are re-pushed via
  # git push --follow-tags below.
  OLD_TAGS=$(git tag -l)
  pnpm lerna version --yes --no-push
  echo "$OLD_TAGS" | xargs -r git tag -d

  # Re-run build only (not tests) after version bump so that published dist
  # files reflect the new package versions if any package embeds its own version.
  # Tests are skipped here because they already passed above and version bumps
  # do not affect test outcomes.
  pnpm turbo run build --filter=[$LATEST_TAG_SHA]

  # Push changes.
  git push --follow-tags

  # Publish packages with retry logic.
  # `pnpm -r publish` reads versions from package.json and skips packages already
  # on the registry, so retries never re-publish already-published packages.
  for attempt in 1 2 3; do
    pnpm -r publish --no-git-checks --provenance && break
    if [ "$attempt" -lt 3 ]; then
      echo "Publish attempt $attempt failed, retrying in 30 seconds..."
      sleep 30
    else
      echo "Publish failed after 3 attempts."
      exit 1
    fi
  done
else
  echo "No changes detected on packages, skipping publish..."
fi

# Deploy after publish because there are cases in which a package is versioned
# and it should be on NPM registry to Lambda Layer create the new version when
# carlin deploy starts.
pnpm turbo run build test deploy --filter=[$LATEST_TAG_SHA] --filter=@docs/website