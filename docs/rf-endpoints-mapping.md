# Matriz RF -> Endpoints OpenAPI (Sprint 1)

Este documento mapeia os requisitos funcionais do GREENHERB para as operacoes da API especificadas na Sprint 1.

## Escopo da Sprint 1

- Incluido: RF-02 a RF-15 (recursos principais do dominio)
- Excluido desta sprint: fluxo de autenticacao funcional (RF-01)

## Convencoes

- Prefixo de API: `/api/v1`
- Formato base de erro: `ErrorResponse`
- Seguranca: documentada via `BearerAuth` no OpenAPI, sem implementacao de auth nesta sprint

## Rastreabilidade

| RF | Descricao resumida | Endpoints OpenAPI |
|---|---|---|
| RF-02 | Gestao de utilizadores | `GET /users`, `POST /users`, `GET /users/{userId}`, `PATCH /users/{userId}`, `DELETE /users/{userId}` |
| RF-03 | Gestao e importacao de ervas aromaticas | `GET /herbs`, `POST /herbs`, `GET /herbs/{herbId}`, `PATCH /herbs/{herbId}`, `DELETE /herbs/{herbId}`, `POST /herbs/import` |
| RF-04 | Criacao e gestao de planos de cultivo | `GET /cultivation-plans`, `POST /cultivation-plans`, `GET /cultivation-plans/{planId}`, `PATCH /cultivation-plans/{planId}`, `DELETE /cultivation-plans/{planId}` |
| RF-05 | Associacao de planos a lotes e consulta de estado | `GET /batches`, `POST /batches`, `GET /batches/{batchId}`, `PATCH /batches/{batchId}`, `POST /batches/{batchId}/plans` |
| RF-06 | Registo e execucao de tarefas | `GET /tasks`, `POST /tasks`, `GET /tasks/{taskId}`, `PATCH /tasks/{taskId}`, `POST /tasks/{taskId}/complete` |
| RF-07 | Registo de medicoes ambientais | `POST /measurements`, `GET /measurements` |
| RF-08 | Geracao automatica de alertas | `POST /measurements` (efeito colateral documentado), `GET /alerts` |
| RF-09 | Resolver/ignorar alertas com justificacao | `POST /alerts/{alertId}/resolve`, `POST /alerts/{alertId}/ignore`, `GET /alerts/{alertId}` |
| RF-10 | Modo manual e automatico | `GET /automation/mode`, `PUT /automation/mode` |
| RF-11 | Historico de medicoes/intervencoes/alertas | `GET /measurements`, `GET /tasks`, `GET /alerts` |
| RF-12 | Comparacao real vs esperado | `GET /batches/{batchId}/plan-vs-actual` |
| RF-13 | Exportacao CSV/Excel | `GET /reports/export` |
| RF-14 | Divisao de lotes, perdas e produtividade | `POST /batches/{batchId}/split`, `POST /batches/{batchId}/losses`, `GET /batches/{batchId}/productivity` |
| RF-15 | Logs de auditoria | `GET /audit-logs` |

## Regras de negocio criticas representadas na API

- Plano pontual exige autorizacao explicita de responsavel (`CultivationPlan` com `approval` obrigatorio para `type: ponctual`).
- Ignorar alerta exige justificacao (`POST /alerts/{alertId}/ignore` com `reason` obrigatorio).
- Estados de lote e alerta modelados com enum.
- Severidade de alerta modelada com enum (`informativo`, `aviso`, `critico`).
