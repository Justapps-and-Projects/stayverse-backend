#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "Logged in as:"
eas whoami

echo ""
echo "=== User app: configure iOS credentials + production build ==="
cd "$ROOT/apps/user-app"
eas credentials:configure-build -p ios -e production
EAS_NO_VCS=1 eas build --platform ios --profile production --non-interactive --no-wait

echo ""
echo "=== Agent app: configure iOS credentials + production build ==="
cd "$ROOT/apps/agent-app"
eas credentials:configure-build -p ios -e production
EAS_NO_VCS=1 eas build --platform ios --profile production --non-interactive --no-wait

echo "Done. Check builds at https://expo.dev/accounts/oyekunlesolomon"
