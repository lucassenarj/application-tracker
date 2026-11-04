#!/usr/bin/env bash
set -euo pipefail

# One-time bootstrap script for the daily-db-backup bucket.
#
# Sets the 30-day lifecycle deletion rule and the 7-day Object Lock
# Default Bucket Retention, both read from b2-lifecycle-config.json.
#
# Run manually, once, from a local machine, authenticated with a
# bucket-scoped setup key (readBuckets, writeBuckets,
# readBucketRetentions, writeBucketRetentions) -- never from CI, and
# never stored as a GitHub Secret. See
# notes/backend-hardening/daily-db-backup-design-doc.md for the full
# reasoning.

CONFIG_FILE="$(dirname "$0")/b2-lifecycle-config.json"

B2_BUCKET="${B2_BUCKET:?Set B2_BUCKET}"
B2_SETUP_KEY_ID="${B2_SETUP_KEY_ID:?Set B2_SETUP_KEY_ID}"
B2_SETUP_APP_KEY="${B2_SETUP_APP_KEY:?Set B2_SETUP_APP_KEY}"

LIFECYCLE_RULE=$(jq -c '.lifecycleRule' "$CONFIG_FILE")
RETENTION_MODE=$(jq -r '.defaultRetention.mode' "$CONFIG_FILE")
RETENTION_PERIOD=$(jq -r '.defaultRetention.period' "$CONFIG_FILE")

b2 authorize-account "$B2_SETUP_KEY_ID" "$B2_SETUP_APP_KEY"

b2 update-bucket \
  --lifecycle-rule "$LIFECYCLE_RULE" \
  --default-retention-mode "$RETENTION_MODE" \
  --default-retention-period "$RETENTION_PERIOD" \
  "$B2_BUCKET" allPrivate
