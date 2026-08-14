#!/usr/bin/env bash
# Disk cleanup for the HockeySpare Raspberry Pi (also the self-hosted deploy runner).
# Safe to run manually or as a pre-deploy step: only touches logs, apt cache,
# and stale GitHub Actions runner work dirs -- never app/service files.

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
