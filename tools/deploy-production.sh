#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

: "${DEPLOY_HOST:?Set DEPLOY_HOST to the production server hostname or IP}"
DEPLOY_USER="${DEPLOY_USER:-dennis}"
DEPLOY_PORT="${DEPLOY_PORT:-2267}"
DEPLOY_KEY="${DEPLOY_KEY:-$HOME/.ssh/ChatGPT_KEY}"
DEPLOY_ROOT="${DEPLOY_ROOT:-/var/www/easykiconverter-website}"
REMOTE_BACKUP_ROOT="${REMOTE_BACKUP_ROOT:-/var/www/backups}"

if [[ ! -r "$DEPLOY_KEY" ]]; then
  printf 'Error: SSH key is not readable: %s\n' "$DEPLOY_KEY" >&2
  exit 1
fi

pnpm run build

deploy_id="$(date +%Y%m%d-%H%M%S)"
remote_target="${DEPLOY_USER}@${DEPLOY_HOST}"
remote_stage="/var/www/.easyki-website-stage-${deploy_id}"
remote_backup="${REMOTE_BACKUP_ROOT}/easykiconverter-website-${deploy_id}"
ssh_args=(-i "$DEPLOY_KEY" -p "$DEPLOY_PORT" -o BatchMode=yes -o StrictHostKeyChecking=accept-new)

printf 'Deploying %s to %s:%s\n' "$deploy_id" "$remote_target" "$DEPLOY_ROOT"

ssh "${ssh_args[@]}" "$remote_target" \
  "sudo mkdir -p '$remote_backup' '$remote_stage' && \
   if [ -d '$DEPLOY_ROOT' ]; then sudo cp -a '$DEPLOY_ROOT/.' '$remote_backup/'; fi && \
   sudo chown -R '$DEPLOY_USER':'$DEPLOY_USER' '$remote_stage'"

tar -C dist -cf - . | ssh "${ssh_args[@]}" "$remote_target" "tar -C '$remote_stage' -xf -"

ssh "${ssh_args[@]}" "$remote_target" \
  "set -eu; \
   previous='${DEPLOY_ROOT}.previous-${deploy_id}'; \
   if [ -e '$DEPLOY_ROOT' ]; then sudo mv '$DEPLOY_ROOT' \"\$previous\"; fi; \
   sudo mv '$remote_stage' '$DEPLOY_ROOT'; \
   if ! sudo nginx -t; then \
     sudo rm -rf '$DEPLOY_ROOT'; \
     if [ -e \"\$previous\" ]; then sudo mv \"\$previous\" '$DEPLOY_ROOT'; fi; \
     exit 1; \
   fi; \
   sudo systemctl reload nginx; \
   printf 'Deployed. Backup: %s\n' '$remote_backup'"
