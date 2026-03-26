Instalar e rodar n8n localmente (Docker)

1) Pré-requisitos
- Docker Desktop instalado e rodando
- Permissões para criar volumes/arquivos na pasta do projeto

2) Arquivo fornecido
- `docker-compose.yml` (localizado na raiz do projeto). Ele monta `./n8n` como diretório de dados persistente.

3) Comandos rápidos

Windows / PowerShell:
```powershell
docker compose up -d
``` 

Verificar logs:
```powershell
docker compose logs -f
```

Parar/remover:
```powershell
docker compose down
```

4) Acesso
- Abra: http://localhost:5678
- Credenciais (conforme `docker-compose.yml`): `admin` / `changeme` (mude a senha em produção)

5) Notas
- O diretório `./n8n` será criado no workspace e conterá os dados de workflows.
- Se preferir, pode usar `docker run -it --rm -p 5678:5678 -v %USERPROFILE%/.n8n:/home/node/.n8n n8nio/n8n`.
