# GREENHERB - Backend (Programacao em Servidor)

Backend Node.js + Express + Mongoose que implementa os endpoints definidos em [openapi.yaml](openapi.yaml). A implementacao cobre todos os recursos principais do dominio do enunciado (utilizadores, ervas, planos de cultivo, lotes, tarefas, medicoes, alertas, automacao, relatorios e auditoria).

A autenticacao via JWT (RF-01) continua reservada para sprint posterior. O mecanismo de seguranca esta documentado na spec OpenAPI (`BearerAuth`).

## Requisitos

- Node.js 20+
- MongoDB 7+ (local ou remoto)

## Configuracao

```bash
cp .env.example .env
npm install
npm run dev
```

`.env` esperado:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/greenherb
```

## Endpoints implementados

Base URL: `http://localhost:3000/api/v1`

### Utilizadores (`/users`)

- `GET /users`
- `POST /users`
- `GET /users/:userId`
- `PATCH /users/:userId`
- `DELETE /users/:userId` (desativa o utilizador, nao apaga)

### Ervas aromaticas (`/herbs`)

- `GET /herbs`
- `POST /herbs`
- `GET /herbs/:herbId`
- `PATCH /herbs/:herbId`
- `DELETE /herbs/:herbId`
- `POST /herbs/import` (placeholder: aceita import, devolve `importId` e estado `queued`)

### Planos de cultivo (`/cultivation-plans`)

- `GET /cultivation-plans?type=regular|emergencia|pontual`
- `POST /cultivation-plans` (valida campos obrigatorios por tipo)
- `GET /cultivation-plans/:planId`
- `PATCH /cultivation-plans/:planId`
- `DELETE /cultivation-plans/:planId`

### Lotes (`/batches`)

- `GET /batches?status=ativo|concluido|comprometido`
- `POST /batches`
- `GET /batches/:batchId`
- `PATCH /batches/:batchId`
- `DELETE /batches/:batchId`
- `POST /batches/:batchId/plans` (associa plano)
- `POST /batches/:batchId/split` (divide em sub-lotes)
- `POST /batches/:batchId/losses` (regista perda com justificacao)
- `GET /batches/:batchId/productivity` (yield, perda, % produtividade, duracao)
- `GET /batches/:batchId/plan-vs-actual` (medias reais vs plano regular)

### Tarefas (`/tasks`)

- `GET /tasks?batchId=...&status=pendente|concluida`
- `POST /tasks` (tipo: `rega`, `fertilizacao`, `colheita`, `monitorizacao`)
- `GET /tasks/:taskId`
- `PATCH /tasks/:taskId`
- `POST /tasks/:taskId/complete`

### Medicoes (`/measurements`)

- `GET /measurements?batchId=...&from=...&to=...`
- `POST /measurements` (gera alertas automaticamente quando os valores ficam fora do plano regular)

### Alertas (`/alerts`)

- `GET /alerts?batchId=...&status=...&severity=...`
- `GET /alerts/:alertId`
- `POST /alerts/:alertId/resolve`
- `POST /alerts/:alertId/ignore` (campo `reason` obrigatorio, minimo 3 caracteres)

### Automacao (`/automation`)

- `GET /automation/mode`
- `PUT /automation/mode` (`mode`: `manual` ou `automatico`)

### Relatorios (`/reports`)

- `GET /reports/export?format=csv` (XLSX devolve 501 nesta sprint)

### Auditoria (`/audit-logs`)

- `GET /audit-logs?actorId=...&from=...&to=...`

## Geracao automatica de alertas

Ao criar uma medicao, o servico `alert-generation.service.js` procura o plano `regular` associado ao lote, compara os valores de temperatura, humidade e luminosidade com os intervalos definidos e cria alertas com severidade:

- `informativo` ate 10% de desvio relativo ao intervalo
- `aviso` ate 30% de desvio
- `critico` acima disso

## Audit log

Operacoes sensiveis (criar/atualizar/desativar utilizadores, criar/alterar planos, dividir/registar perdas em lotes, completar tarefas, resolver/ignorar alertas, mudar modo de automacao) registam um evento em `AuditLog` via header opcional `x-actor-id`.

## Notas

- Autenticacao JWT e controlo por perfis (RF-01) continuam para sprint posterior.
- Exportacao em XLSX reservada para sprint posterior; CSV implementado.
- A implementacao segue o contrato em [openapi.yaml](openapi.yaml). Pequenos detalhes (ex.: `import` async) ficam como placeholders explicitos.
