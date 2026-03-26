Workflow: Webhook -> HTTP Proxy

Objetivo
- Criar um endpoint HTTP no n8n que receba requisições do front, chame APIs existentes (proxy/enrich) e retorne a resposta.

Importar no n8n
1. Inicie o n8n (veja `README-n8n.md`).
2. Acesse: http://localhost:5678
3. Workflows -> Import -> carregar `n8n_workflows/webhook-proxy-workflow.json`.
4. Abra o workflow, ative (turn on) e salve.

Como o workflow funciona
- `Webhook` node: expõe o caminho `api/proxy` (POST). Quando ativado, o n8n mostrará a URL completa do webhook (ex.: `http://localhost:5678/webhook/<workflowId>/api/proxy`).
- `HTTP Request` node: usa `{{ $json["targetUrl"] }}` como `url` e `{{ $json["method"] || 'GET' }}` como método. Envie no body JSON os campos `targetUrl`, `method` e `body`.
- `Respond to Webhook` node: retorna o resultado do `HTTP Request` ao cliente.

Exemplo de requisição a partir do Angular (fetch):
```javascript
// corpo exemplo
const payload = {
  targetUrl: 'https://jsonplaceholder.typicode.com/posts',
  method: 'POST',
  body: { title: 'foo', body: 'bar', userId: 1 }
};

fetch('http://localhost:5678/webhook/<workflowId>/api/proxy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer SEU_TOKEN_DE_WEBHOOK' },
  body: JSON.stringify(payload)
})
  .then(res => res.json())
  .then(data => console.log('Resposta do proxy:', data))
  .catch(err => console.error(err));
```

Observações de segurança
- Proteja o webhook: ative Basic Auth no n8n (já incluído no `docker-compose.yml`) ou adicione header/token e valide no workflow antes de prosseguir.
- Não passe credenciais sensíveis do front para APIs externas; armazene credenciais no n8n (`Credentials`) e configure `HTTP Request` para usar credenciais.
- Para respostas assíncronas (API lenta), devolva um ACK imediato e use nodes para processamento em background/salvar em DB.

Quer que eu:
- A) gere um snippet Angular `HttpClient` (serviço) pronto para usar com esse webhook; or
- B) adicione validação de token ao workflow (ex.: checar `Authorization` header) e exporte versão protegida; or
- C) ajustar o workflow para transformar/enriquecer respostas (ex.: chamar OpenAI antes de enviar à API)?
Escolha A, B ou C.