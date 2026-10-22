#!/bin/sh
# Prints the turbo `--filter` arguments selecting the packages changed since
# the ref in $1 and their dependents: what `--filter=...[$1]` means, without
# the scope turbo adds to it.
#
# turbo marks every package changed when a package the root package.json
# depends on changes, directly or transitively (carlin, @ttoss/config,
# @ttoss/eslint-config, @ttoss/monorepo and their dependencies): a carlin
# README edit put all 65 packages in scope. pnpm's filter maps each changed
# file to its package and adds the dependents, with no such rule.
#
# turbo's own filter stays for the root files pnpm attributes to the root
# alone: turbo maps a lockfile change to the packages whose dependencies moved,
# and the other files change what every task runs with.
set -e

BASE=$1

if git diff --name-only "$BASE" | grep -qxE 'pnpm-lock\.yaml|package\.json|pnpm-workspace\.yaml|turbo\.json|\.npmrc'; then
  echo "--filter=...[$BASE]"
  exit 0
fi

# A failed listing falls back to turbo's filter: wider, never narrower.
LISTING=$(pnpm ls -r --filter "...[$BASE]" --depth -1 --json) || {
  echo "--filter=...[$BASE]"
  exit 0
}

echo "$LISTING" | node -e '
const root = process.cwd();
let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  const names = JSON.parse(input)
    .filter((pkg) => pkg.path !== root)
    .map((pkg) => `--filter=${pkg.name}`);
  // `//` selects only the root, which has none of these tasks: nothing runs.
  console.log(names.length ? names.join(" ") : "--filter=//");
});
'
