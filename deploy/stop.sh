#!/bin/bash
# ============================================
# Script para parar todos os containers
# ============================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Parando todos os containers ContfyWeb..."
docker compose -f docker-compose.prod.yml down

echo "Containers parados com sucesso."
