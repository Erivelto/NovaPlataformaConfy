@echo off
REM ============================================
REM Script de Deploy - ContfyWeb (Windows)
REM ============================================

cd /d "%~dp0"

echo ========================================
echo   ContfyWeb - Deploy de Producao
echo ========================================

REM Verifica se .env existe
if not exist ".env" (
    echo Arquivo .env nao encontrado. Copiando de .env.example...
    copy .env.example .env
    echo.
    echo  ATENCAO: Edite o arquivo deploy\.env com suas configuracoes!
    echo  Depois execute este script novamente.
    pause
    exit /b 1
)

echo [1/3] Fazendo build da imagem Docker...
docker compose -f docker-compose.prod.yml build --no-cache contfy-web

echo [2/3] Parando containers antigos...
docker compose -f docker-compose.prod.yml down

echo [3/3] Iniciando containers...
docker compose -f docker-compose.prod.yml up -d

echo.
echo ========================================
echo   Deploy concluido com sucesso!
echo ========================================
echo.
echo Frontend:  http://localhost:80
echo n8n:       http://localhost:5678
echo.
echo Logs: docker compose -f deploy/docker-compose.prod.yml logs -f
pause
