# ContfyWeb - Guia de Deploy

## Estrutura da pasta `deploy/`

```
deploy/
├── .env.example          # Variáveis de ambiente (modelo)
├── .dockerignore         # Arquivos ignorados no build Docker
├── Dockerfile            # Multi-stage build (Node + Nginx)
├── docker-compose.prod.yml  # Orquestração dos containers
├── nginx.conf            # Config padrão do Nginx (API fixa)
├── nginx.conf.template   # Config do Nginx com variável API_URL
├── deploy.sh             # Script de deploy (Linux/Mac)
├── deploy.bat            # Script de deploy (Windows)
└── stop.sh               # Script para parar containers
```

## Pré-requisitos

- **Docker** >= 20.x
- **Docker Compose** >= 2.x

## Deploy Rápido

### Linux / Mac

```bash
cd deploy
cp .env.example .env      # Edite as variáveis conforme necessário
chmod +x deploy.sh
./deploy.sh
```

### Windows

```cmd
cd deploy
copy .env.example .env
deploy.bat
```

## Variáveis de Ambiente (.env)

| Variável       | Padrão                                      | Descrição                      |
|----------------|----------------------------------------------|--------------------------------|
| `WEB_PORT`     | `80`                                         | Porta do frontend              |
| `API_URL`      | `https://contfyapinovo-...azurewebsites.net` | URL da API backend             |
| `N8N_PORT`     | `5678`                                       | Porta do n8n                   |
| `N8N_USER`     | `admin`                                      | Usuário do n8n                 |
| `N8N_PASSWORD` | `changeme`                                   | Senha do n8n (ALTERE!)         |
| `MOCK_API_PORT`| `3000`                                       | Porta do JSON Server (mock)    |

## Comandos Úteis

```bash
# Ver logs em tempo real
docker compose -f deploy/docker-compose.prod.yml logs -f

# Ver logs apenas do frontend
docker compose -f deploy/docker-compose.prod.yml logs -f contfy-web

# Reiniciar apenas o frontend
docker compose -f deploy/docker-compose.prod.yml restart contfy-web

# Rebuild e redeploy
docker compose -f deploy/docker-compose.prod.yml up -d --build contfy-web

# Parar tudo
docker compose -f deploy/docker-compose.prod.yml down

# Subir com mock API (perfil mock)
docker compose -f deploy/docker-compose.prod.yml --profile mock up -d
```

## Arquitetura

```
                    ┌─────────────┐
  Usuário ────────► │  Nginx (:80)│
                    │  Angular SPA│
                    └──────┬──────┘
                           │ /api/*
                           ▼
                    ┌─────────────┐
                    │  API Backend│
                    │  (Azure)    │
                    └─────────────┘

                    ┌─────────────┐
                    │  n8n (:5678)│
                    │  Workflows  │
                    └─────────────┘
```

## Segurança em Produção

1. **Altere a senha do n8n** no arquivo `.env`
2. **Configure HTTPS** usando um proxy reverso (ex: Traefik, Caddy) ou certificado SSL direto no Nginx
3. **Não commite** o arquivo `.env` — ele já está no `.dockerignore`
4. **Firewall**: libere apenas as portas necessárias (80/443 para web, 5678 se n8n for externo)
