export ENVIRONMENT=Production

# Check if the current HEAD is already tagged on the remote.
# Uses git ls-remote to avoid the cost of fetching all tags locally.
HEAD_SHA=$(git rev-parse HEAD)
if git ls-remote --tags origin | awk '{print $1}' | grep -q "^$HEAD_SHA$"; then
  echo "There are tags in the current commit, exiting main workflow"
  exit 0
fi

# Find the latest tag name without fetching all tags locally.
export LATEST_TAG=$(git ls-remote --tags origin | grep -v '\^{}' | awk '{print $2}' | sed 's|refs/tags/||' | sort -V | tail -1)

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

# Publish packages only if `pnpm lerna changed` is success. This happens when
# exists an update on root and no packages changes. This way, `version` won't
# create tags and `git diff HEAD^1 origin/main --quiet` will fail because
# HEAD^1 will diff from origin/main.
if pnpm lerna changed; then
  echo "Changes detected on packages, publishing them..."

  # Version before publish to rebuild all packages that Lerna will publish.
  # Delete local tags only after lerna version runs so it can use them as a
  # baseline to determine which packages changed. Tags are re-pushed via
  # git push --follow-tags below.
  pnpm lerna version --yes --no-push
  git tag -l | xargs -r git tag -d

  # Test and build all packages since $LATEST_TAG
  # and all the workspaces that depends on them.
  # https://turbo.build/repo/docs/core-concepts/monorepos/filtering#include-dependents-of-matched-workspaces
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

  # Use Git to check for changes in the origin repository. If there are any
  # changes, "git push --follow-tags" will fail. The error message will be:
  #
  # error: failed to push some refs to 'github.com:ttoss/ttoss.git'
  # hint: Updates were rejected because the remote contains work that you do
  # hint: not have locally. This is usually caused by another repository pushing
  # hint: to the same ref. You may want to first integrate the remote changes
  # hint: (e.g., 'git pull ...') before pushing again.
  #
  # To avoid this, we need to:
  #
  # 1. Fetch the latest changes from the origin/main repository.
  # 2. Compare the local and remote main branches using `git diff`.
  # 3. Check if there are any changes and stop the workflow if there are any.
  # 4. Exit and wait to the next main workflow starts because of the changes.
  git fetch origin main

  # HEAD^1 because lerna version created a commit.
  git diff HEAD^1 origin/main --quiet || { echo "Changes found before publishing. Workflow stopped." && exit 1; }

  # Push changes.
  git push --follow-tags

  # Publish packages with retry logic.
  # `pnpm -r publish` reads versions from package.json and skips packages already
  # on the registry, so retries never re-publish already-published packages.
  for attempt in 1 2 3; do
    pnpm -r publish --no-git-checks && break
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