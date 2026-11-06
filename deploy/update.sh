#!/usr/bin/env bash
# Pull, rebuild and restart the cashier app. Run from the repo root.
# Pulls the branch that is checked out (normally development).
# NEXT_PUBLIC_* come from .env.local or .env (Next.js reads both; .env.local
# wins) and are baked in at build time.
set -euo pipefail

env_file=""
for f in .env.local .env; do
  if [ -f "$f" ] && grep -q '^NEXT_PUBLIC_CASHIER_USER_ID=.' "$f"; then env_file=$f; break; fi
done
test -n "$env_file" || { echo "Set NEXT_PUBLIC_CASHIER_USER_ID in .env.local or .env (cashiers cannot send orders without it)"; exit 1; }
echo "Building with NEXT_PUBLIC_* from $env_file"

branch=$(git rev-parse --abbrev-ref HEAD)

# GitHub sometimes refuses a connection for a moment ("Permission denied
# (publickey)" or a 5xx) and lets the next one in: try a few times before
# giving up. --ff-only: the server never has commits of its own.
pull() {
  for i in 1 2 3 4; do
    git pull --ff-only origin "$branch" && return 0
    echo "git pull failed (try $i of 4), trying again in $((i * 5)) s" >&2
    sleep $((i * 5))
  done
  echo "Could not pull from GitHub. Check: ssh -T git@github.com" >&2
  return 1
}
pull
npm ci
npm run build
pm2 reload sofi-beso-frontend --update-env

pm2 list
