Clients API via n8n + json-server

Objetivo
- Fornecer endpoints locais (`/clients`) via n8n que usam `json-server` como backend persistente.

Arquivos gerados
- `docker-compose.yml` — inclui `n8n` e `json-server` (porta 3000).
- `mock-api/db.json` — base inicial com 3 clientes.
- `n8n_workflows/clients-api-workflow.json` — workflow importável no n8n que expõe um webhook `/clients` e faz proxy para `json-server`.

Fluxos suportados (via webhook único)
- GET /clients                     -> lista todos os clientes
- GET /clients?id=123              -> obter cliente por id
- POST /clients (body JSON)        -> cria novo cliente (envie `name`, `email`, ...)
- DELETE /clients (body or query: id) -> deleta cliente por id

Como usar
1) Suba os serviços (na raiz do projeto):
```powershell
docker compose up -d
```
2) Abra o n8n em http://localhost:5678 e importe `n8n_workflows/clients-api-workflow.json`.
3) Ative o workflow. Copie a URL do webhook (n8n mostrará algo como `http://localhost:5678/webhook/<id>/clients`).

Exemplos de chamadas (usar URL do webhook retornada pelo n8n):
- Listar todos:
```bash
curl -X POST 'http://localhost:5678/webhook/<id>/clients' -H 'Content-Type: application/json' -d '{}'
# o workflow aceita POST como wrapper do GET; para usar GET puro, você pode configurar o Webhook method na UI também.
```
- Obter por id:
```bash
curl -X POST 'http://localhost:5678/webhook/<id>/clients?id=2' -H 'Content-Type: application/json' -d '{}'
```
- Criar novo cliente:
```bash
curl -X POST 'http://localhost:5678/webhook/<id>/clients' -H 'Content-Type: application/json' -d '{"name":"Empresa D","email":"d@ex.com","phone":"(11)99999-0004"}'
```
- Deletar:
```bash
curl -X POST 'http://localhost:5678/webhook/<id>/clients' -H 'Content-Type: application/json' -d '{"id":3,"_action":"delete"}'
```

Observações
- O workflow atualmente detecta o método enviado no envelope (`_request.method`) ou `method` no body; porém o webhook node por padrão em export usa `POST` quando você testa com curl. Para testes rápidos, sempre use `POST` com body ou passe `id` por query string.
- O `json-server` fornece persistência em `mock-api/db.json`.

Quer que eu agora:
A) adicione um snippet Angular `ClientsService` com `getAll`, `create`, `delete` pronto para colar no projeto; ou
B) ajusto o workflow para aceitar métodos HTTP reais (configurar múltiplos webhooks separados por método) e incluir proteção por token; ou
C) gere telas cliente (component) integrado ao `ClientsService` no projeto?"