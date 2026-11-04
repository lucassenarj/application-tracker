#!/usr/bin/env bash
set -euo pipefail

# Full local bootstrap for the daily-db-backup bucket.
#
# Takes only the account's MASTER key as input (typed once, never
# stored). Mints a short-lived, bucket-scoped setup key from it, then
# immediately uses that key to run configure-b2-lifecycle.sh -- all
# inside one throwaway Docker container. Nothing is installed on the
# host, and nothing persists after this script exits.
#
# See notes/backend-hardening/daily-db-backup-design-doc.md for the
# full reasoning (two-key split, why the setup key is never stored).

docker run --rm -it \
  -v "$(pwd)/scripts:/scripts" \
  -e B2_BUCKET="${B2_BUCKET:?Set B2_BUCKET}" \
  -e B2_MASTER_KEY_ID="${B2_MASTER_KEY_ID:?Set B2_MASTER_KEY_ID}" \
  -e B2_MASTER_APP_KEY="${B2_MASTER_APP_KEY:?Set B2_MASTER_APP_KEY}" \
  python:3.12-slim \
  bash -c '
    set -euo pipefail
    apt-get update -qq
    apt-get install -y -qq jq
    pip install --quiet "b2>=3.16,<4" "docutils<0.21"

    b2 authorize-account "$B2_MASTER_KEY_ID" "$B2_MASTER_APP_KEY"

    KEY_OUTPUT=$(b2 create-key --duration 3600 \
      application-tracker-setup \
      listBuckets,writeBuckets,readBucketRetentions,writeBucketRetentions)

    read -r B2_SETUP_KEY_ID B2_SETUP_APP_KEY <<< "$KEY_OUTPUT"
    export B2_SETUP_KEY_ID B2_SETUP_APP_KEY

    if [ -z "$B2_SETUP_KEY_ID" ] || [ -z "$B2_SETUP_APP_KEY" ]; then
      echo "Could not parse the new key from b2 create-key output:" >&2
      echo "$KEY_OUTPUT" >&2
      exit 1
    fi

    bash /scripts/configure-b2-lifecycle.sh
  '
