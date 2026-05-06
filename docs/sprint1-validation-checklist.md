# Sprint 1 - Validacao e Checklist (OpenAPI)

## Estado da validacao OpenAPI

- Ficheiro validado: `openapi.yaml`
- Ferramenta: `npx @redocly/cli lint openapi.yaml`
- Resultado: **valido** (sem erros bloqueantes)
- Observacao: existem avisos de estilo/recomendacao (ex.: `operationId` e resposta `4xx` em algumas operacoes) que podem ser fechados na Sprint 2 como melhoria de qualidade documental.

## Checklist Definition of Done

- [x] Endpoints principais do dominio definidos na spec.
- [x] `components/schemas` centralizado com entidades principais.
- [x] Regras criticas modeladas:
  - [x] ignorar alerta exige justificacao;
  - [x] modos manual/automatico;
  - [x] estados de lote e alerta com enum;
  - [x] tipos de plano (regular, emergencia, pontual).
- [x] Erros padronizados em `ErrorResponse`.
- [x] Seguranca documentada via `BearerAuth` (sem implementacao de auth nesta sprint).
- [x] Exemplos incluidos em operacoes criticas (planos, medicoes, ignorar alerta).
- [x] Matriz de rastreabilidade RF -> endpoints criada em `docs/rf-endpoints-mapping.md`.

## Cobertura RF/RNF da sprint

- RF cobertos: RF-02 a RF-15 (por especificacao API).
- RF fora do escopo desta sprint: RF-01 (implementacao de autenticacao).
- RNF cobertos na spec: RNF-06 (OpenAPI), parte de RNF-03 (apenas documentacao de seguranca).

## Melhorias recomendadas (proxima sprint)

1. Adicionar `operationId` em todas as operacoes.
2. Garantir pelo menos um `4xx` em todas as operacoes de leitura/atualizacao.
3. Adicionar mais exemplos de resposta para `reports` e `audit-logs`.
4. Publicar Swagger UI local para demonstracao em aula.
