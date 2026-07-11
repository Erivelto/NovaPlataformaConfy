#!/usr/bin/env bash
set -euo pipefail

echo "=== Amplify build ==="
echo "AWS_APP_ID=${AWS_APP_ID:-<unset>}"
echo "AWS_BRANCH=${AWS_BRANCH:-<unset>}"
echo "DEPLOY_TARGET=${DEPLOY_TARGET:-<unset>}"

SITE_APP_ID="d64oxvnbymsbo"

if [ "${DEPLOY_TARGET:-}" = "site" ] || [ "${AWS_APP_ID:-}" = "$SITE_APP_ID" ]; then
  echo "Build: site (SiteContfy / contfy.com.br)"
  npx ng build --configuration site
  SRC="dist/contfy-site/browser"
else
  echo "Build: app (contabilcontfy.com.br)"
  npx ng build --configuration production
  SRC="dist/novoangularbackv2/browser"
fi

if [ ! -d "$SRC" ]; then
  echo "ERROR: output directory not found: $SRC"
  ls -la dist || true
  exit 1
fi

rm -rf dist/deploy
mkdir -p dist/deploy
cp -r "$SRC"/. dist/deploy/
echo "Deploy artifacts ready in dist/deploy"
