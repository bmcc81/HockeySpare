#!/usr/bin/env bash
# Disk cleanup for the HockeySpare Raspberry Pi (also the self-hosted deploy runner,
# and host to a few other small sites/services).
# Safe to run manually or as a pre-deploy step: only touches logs, apt cache,
# reclaimable package-manager/build caches, unused Docker images, and stale
# GitHub Actions runner version dirs -- never app/service files or data volumes.

set -uo pipefail

JOURNAL_KEEP_DAYS="${JOURNAL_KEEP_DAYS:-7}"
RUNNER_WORK_KEEP_DAYS="${RUNNER_WORK_KEEP_DAYS:-3}"
OLD_LOG_KEEP_DAYS="${OLD_LOG_KEEP_DAYS:-14}"
FAIL_THRESHOLD_PERCENT="${FAIL_THRESHOLD_PERCENT:-90}"
RUNNER_WORK_DIR="${RUNNER_WORK_DIR:-$HOME/actions-runner/_work}"

echo "=== Disk usage before cleanup ==="
df -h /

echo "=== Vacuuming journald logs (keeping ${JOURNAL_KEEP_DAYS}d) ==="
sudo journalctl --vacuum-time="${JOURNAL_KEEP_DAYS}d" || echo "journalctl vacuum skipped/failed, continuing"

echo "=== Cleaning apt cache ==="
sudo apt-get clean
sudo apt-get autoremove --purge -y || echo "apt autoremove skipped/failed, continuing"

echo "=== Pruning rotated log files older than ${OLD_LOG_KEEP_DAYS}d in /var/log ==="
sudo find /var/log -type f \( -name "*.gz" -o -name "*.[0-9]" -o -name "*.old" \) -mtime +"${OLD_LOG_KEEP_DAYS}" -print -delete 2>/dev/null || true

echo "=== Pruning stale GitHub Actions runner work dirs (older than ${RUNNER_WORK_KEEP_DAYS}d) ==="
if [ -d "$RUNNER_WORK_DIR" ]; then
  find "$RUNNER_WORK_DIR" -mindepth 1 -maxdepth 1 -type d \
    -not -name "_actions" -not -name "_tool" -not -name "_temp" -not -name "_actions_temp" \
    -mtime +"${RUNNER_WORK_KEEP_DAYS}" -print -exec rm -rf {} +
else
  echo "Runner work dir not found at $RUNNER_WORK_DIR, skipping."
fi

DIAG_DIR="$(dirname "$RUNNER_WORK_DIR")/_diag"
if [ -d "$DIAG_DIR" ]; then
  echo "=== Pruning runner diag logs older than ${RUNNER_WORK_KEEP_DAYS}d ==="
  find "$DIAG_DIR" -type f -mtime +"${RUNNER_WORK_KEEP_DAYS}" -print -delete
fi

RUNNER_HOME="$(dirname "$RUNNER_WORK_DIR")"
echo "=== Pruning superseded GitHub Actions runner version dirs in ${RUNNER_HOME} ==="
if [ -d "$RUNNER_HOME" ]; then
  (
    cd "$RUNNER_HOME" || exit 0
    CURRENT_BIN="$(readlink -f bin 2>/dev/null || true)"
    CURRENT_EXTERNALS="$(readlink -f externals 2>/dev/null || true)"
    if [ -z "$CURRENT_BIN" ] || [ -z "$CURRENT_EXTERNALS" ]; then
      echo "Could not resolve the active bin/externals symlinks, skipping (don't want to guess and delete the wrong version)."
      exit 0
    fi
    for d in bin.* externals.*; do
      [ -d "$d" ] || continue
      full="$RUNNER_HOME/$d"
      if [ "$full" != "$CURRENT_BIN" ] && [ "$full" != "$CURRENT_EXTERNALS" ]; then
        echo "Removing superseded runner version dir: $d"
        rm -rf -- "$d"
      fi
    done
  )
else
  echo "Runner home not found at $RUNNER_HOME, skipping."
fi

echo "=== Clearing npm/node-gyp caches (reclaimable, rebuilt on demand) ==="
npm cache clean --force >/dev/null 2>&1 || echo "npm cache clean skipped/failed, continuing"
rm -rf "$HOME/.cache/node-gyp" 2>/dev/null || true

if command -v docker >/dev/null 2>&1; then
  echo "=== Pruning unused Docker images (no running containers use them) ==="
  sudo docker image prune -a -f || echo "docker image prune skipped/failed, continuing"
else
  echo "=== Docker not installed, skipping image prune ==="
fi

echo "=== Clearing files in /tmp older than 1 day ==="
sudo find /tmp -mindepth 1 -mtime +1 -not -path "*/hockeyspare-deploy*" -delete 2>/dev/null || true

echo "=== Disk usage after cleanup ==="
df -h /

USAGE_PERCENT=$(df -P / | awk 'NR==2 {gsub("%","",$5); print $5}')
echo "Root filesystem usage is now ${USAGE_PERCENT}%."

if [ "$USAGE_PERCENT" -ge "$FAIL_THRESHOLD_PERCENT" ]; then
  echo "ERROR: root filesystem still at ${USAGE_PERCENT}% (threshold ${FAIL_THRESHOLD_PERCENT}%) after cleanup." >&2
  echo "Refusing to proceed with deploy -- investigate manually (du -xh --max-depth=1 /)." >&2
  exit 1
fi

exit 0
