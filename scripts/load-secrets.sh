#!/usr/bin/env bash
# Fills <project>/.env from Azure Key Vault, without ever showing a secret value.
# Usage: scripts/load-secrets.sh <project-dir> [--fake]
#   Names come from <project-dir>/.env.example (one NAME= per line).
#   APP_ENV=dev (default) uses crumb-kv-dev; APP_ENV=prod uses crumb-kv-prod.
#   A secret called MY_SECRET lives in the vault as my-secret (vault names can't have underscores).
#   --fake writes placeholder values so this runs without Azure.
# Why it works this way: docs/secrets.md
set -euo pipefail

dir="${1:?Usage: scripts/load-secrets.sh <project-dir> [--fake]}"
fake="${2:-}"
env_name="${APP_ENV:-dev}"
case "$env_name" in
  dev|prod) vault="crumb-kv-$env_name" ;;
  *) echo "APP_ENV must be dev or prod" >&2; exit 1 ;;
esac
[ -f "$dir/.env.example" ] || { echo "No $dir/.env.example to read names from" >&2; exit 1; }

umask 077
tmp="$(mktemp "$dir/.env.XXXXXX")"
trap 'rm -f "$tmp"' EXIT

names=0
while IFS= read -r line; do
  name="${line%%=*}"
  [[ "$name" =~ ^[A-Z][A-Z0-9_]*$ ]] || continue   # skips blanks and comments
  vault_name="$(printf '%s' "$name" | tr 'A-Z_' 'a-z-')"
  printf '%s=' "$name" >> "$tmp"
  if [ "$fake" = "--fake" ]; then
    printf 'placeholder-%s\n' "$name" >> "$tmp"
  else
    # The value goes straight from az into the file. It never passes through a variable or the terminal.
    az keyvault secret show --vault-name "$vault" --name "$vault_name" --query value -o tsv >> "$tmp"
  fi
  names=$((names + 1))
done < "$dir/.env.example"

chmod 600 "$tmp"
mv "$tmp" "$dir/.env"
trap - EXIT
if [ "$fake" = "--fake" ]; then source_name="placeholders (fake mode)"; else source_name="$vault"; fi
echo "Wrote $names secret(s) to $dir/.env from $source_name"
