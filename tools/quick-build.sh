#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
port="${1:-4173}"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "Error: pnpm is required. Install pnpm, then run this script again." >&2
  exit 1
fi

if [[ ! -d "$repo_root/node_modules" ]]; then
  echo "Dependencies are missing; installing from the lockfile..."
  (cd "$repo_root" && pnpm install --frozen-lockfile)
fi

echo "Building the website..."
(cd "$repo_root" && pnpm run build)

echo "Build complete. Preview: http://localhost:${port}"
echo "Press Ctrl+C to stop the preview server."
cd "$repo_root"
exec pnpm run preview --host 127.0.0.1 --port "$port" --ignore-lock
