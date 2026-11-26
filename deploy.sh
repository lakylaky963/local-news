#!/usr/bin/env bash
# Deploy local-news to CT 110 (/opt/local-news, pm2 `news`). Linux twin of deploy.ps1.
# Usage: ./deploy.sh [--no-snapshot]
#   Runs `npm test` here first, then `homelab-deploy local-news` on CT 111
#   (git pull, npm test, snapshot CT 110, rsync, npm install, pm2 restart news, health check).
set -euo pipefail
SELF=$(readlink -f "$0")
cd "$(dirname "$SELF")"

if [[ ${1:-} == -h || ${1:-} == --help ]]; then sed -n '2,5p' "$SELF"; exit 0; fi

echo "== npm test"
npm test

if [[ ! -x /usr/local/bin/homelab-deploy ]]; then
  echo "homelab-deploy not found: run this on CT 111 (agents-hub), or use deploy.ps1." >&2
  exit 1
fi
exec /usr/local/bin/homelab-deploy local-news "$@"
