#!/usr/bin/env bash
# Delete all but the latest tag per package from the remote.
# Safe to re-run — already-deleted tags are silently ignored.
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

BATCH_SIZE=50
DELETED=0
for ((i = 0; i < ${#TAGS_TO_DELETE[@]}; i += BATCH_SIZE)); do
  batch=("${TAGS_TO_DELETE[@]:i:BATCH_SIZE}")
  git push origin --delete "${batch[@]}"
  DELETED=$((DELETED + ${#batch[@]}))
  echo "Deleted $DELETED / ${#TAGS_TO_DELETE[@]} tags..."
done

echo "Done. Deleted ${#TAGS_TO_DELETE[@]} old tags, kept ${#LATEST[@]}."
