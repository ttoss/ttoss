#!/usr/bin/env bash
# Delete all but the latest tag per package from the remote.
# Safe to re-run or run concurrently — tags already deleted by another run are
# skipped (see delete_tags below).
set -euo pipefail

echo "Fetching all remote tags..."
ALL_TAGS=$(git ls-remote --tags origin | grep -v '\^{}' | awk '{print $2}' | sed 's|refs/tags/||')
TOTAL=$(echo "$ALL_TAGS" | wc -l | tr -d ' ')
echo "Total remote tags: $TOTAL"

declare -A LATEST

while IFS= read -r tag; do
  echo "$tag" | grep -qE '@[0-9]+\.[0-9]+\.[0-9]+$' || continue
  prefix=$(echo "$tag" | sed 's/@[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*$//')
  if [ -z "${LATEST[$prefix]+x}" ]; then
    LATEST[$prefix]="$tag"
  else
    newer=$(printf '%s\n%s\n' "${LATEST[$prefix]}" "$tag" | sort -V | tail -1)
    LATEST[$prefix]="$newer"
  fi
done <<< "$ALL_TAGS"

echo "Unique packages: ${#LATEST[@]}"

TAGS_TO_DELETE=()
while IFS= read -r tag; do
  echo "$tag" | grep -qE '@[0-9]+\.[0-9]+\.[0-9]+$' || continue
  prefix=$(echo "$tag" | sed 's/@[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*$//')
  [ "$tag" != "${LATEST[$prefix]:-}" ] && TAGS_TO_DELETE+=("$tag")
done <<< "$ALL_TAGS"

echo "Tags to keep: ${#LATEST[@]}"
echo "Tags to delete: ${#TAGS_TO_DELETE[@]}"

if [ ${#TAGS_TO_DELETE[@]} -eq 0 ]; then
  echo "Nothing to delete."
  exit 0
fi

list_remote_tags() {
  git ls-remote --tags origin | grep -v '\^{}' | awk '{print $2}' | sed 's|refs/tags/||'
}

# Print the tags from the arguments that still exist on the remote.
still_on_remote() {
  local remaining tag
  remaining=$(list_remote_tags)
  for tag in "$@"; do
    if grep -qxF "$tag" <<< "$remaining"; then
      echo "$tag"
    fi
  done
}

# Delete the given tags from the remote. Another run (or a person) may delete
# some of them between our listing and the push; git then rejects the whole
# push ("remote ref does not exist") or the missing refs ("cannot lock ref ...
# unable to resolve reference"). On failure, re-list the remote and retry with
# only the tags still present; fail only if a tag cannot be deleted.
delete_tags() {
  local pending=("$@") attempt
  for attempt in 1 2 3; do
    [ ${#pending[@]} -eq 0 ] && return 0
    if git push origin --delete "${pending[@]}"; then
      return 0
    fi
    echo "Push reported errors (attempt $attempt); re-checking remote tags..."
    mapfile -t pending < <(still_on_remote "${pending[@]}")
  done
  if [ ${#pending[@]} -gt 0 ]; then
    echo "Failed to delete ${#pending[@]} tag(s): ${pending[*]}" >&2
    return 1
  fi
}

BATCH_SIZE=50
DELETED=0
for ((i = 0; i < ${#TAGS_TO_DELETE[@]}; i += BATCH_SIZE)); do
  batch=("${TAGS_TO_DELETE[@]:i:BATCH_SIZE}")
  delete_tags "${batch[@]}"
  DELETED=$((DELETED + ${#batch[@]}))
  echo "Deleted $DELETED / ${#TAGS_TO_DELETE[@]} tags..."
done

echo "Done. Deleted ${#TAGS_TO_DELETE[@]} old tags, kept ${#LATEST[@]}."
