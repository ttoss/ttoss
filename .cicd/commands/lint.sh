# Lint needs i18n files to be generated before running, because some modules
# import the generated i18n files.
pnpm turbo run i18n

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
pnpm run lint -- --allow-empty
[ -z "$(git status --porcelain)" ] || { echo "Error: There are changes after build. Please, commit them locally and push again"; git status; exit 1; }