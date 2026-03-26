#!/bin/bash
# ============================================
# Script de Deploy - ContfyWeb
# ============================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$SCRIPT_DIR"

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ContfyWeb - Deploy de Produção${NC}"
echo -e "${GREEN}========================================${NC}"

# Verifica se .env existe
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Arquivo .env não encontrado. Copiando de .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠  Edite o arquivo deploy/.env com suas configurações antes de continuar!${NC}"
    echo -e "${YELLOW}   Depois execute este script novamente.${NC}"
    exit 1
fi

echo -e "${GREEN}[1/3] Fazendo build da imagem Docker...${NC}"
docker compose -f docker-compose.prod.yml build --no-cache contfy-web

echo -e "${GREEN}[2/3] Parando containers antigos...${NC}"
docker compose -f docker-compose.prod.yml down

echo -e "${GREEN}[3/3] Iniciando containers...${NC}"
docker compose -f docker-compose.prod.yml up -d

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deploy concluído com sucesso!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Frontend:  http://localhost:$(grep WEB_PORT .env | cut -d= -f2 || echo '80')"
echo -e "n8n:       http://localhost:$(grep N8N_PORT .env | cut -d= -f2 || echo '5678')"
echo ""
echo -e "Logs: ${YELLOW}docker compose -f deploy/docker-compose.prod.yml logs -f${NC}"
