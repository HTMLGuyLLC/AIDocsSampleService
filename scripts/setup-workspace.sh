#!/usr/bin/env bash
# Clone or update every project listed in repos.txt into this workspace folder.
# Usage: bash scripts/setup-workspace.sh
#
# Cloned projects are added to .git/info/exclude (a local, uncommitted ignore list),
# so they never get committed into the workspace repo.
set -euo pipefail

cd "$(dirname "$0")/.."
exclude=".git/info/exclude"

while read -r name url _; do
  [[ -z "${name:-}" || "$name" == \#* ]] && continue

  if [[ -d "$name/.git" ]]; then
    echo "Updating $name"
    git -C "$name" pull --ff-only
  elif [[ -d "$name" ]]; then
    echo "Skipping $name: the folder is already part of this repo"
    continue
  else
    echo "Cloning $name"
    git clone "$url" "$name"
  fi

  if [[ -f "$exclude" ]] && ! grep -qx "/$name/" "$exclude"; then
    echo "/$name/" >> "$exclude"
  fi
done < repos.txt

echo "Workspace ready."
