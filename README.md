# GREENHERB · API backend (Programação em Servidor)

Implementação Node.js (**Express**) + **Mongoose** + **MongoDB** do projeto **GREENHERB**: gestão de estufa para ervas aromáticas. O contrato da API está em [`openapi.yaml`](openapi.yaml).

| Sprint | Âmbito |
|--------|--------|
| Sprint 1 | Especificação **OpenAPI 3.x** (artefatos em `openapi.yaml`, `docs/`) |
| Sprint 2+ | Backend e persistência conforme especificação |

**Nota:** autenticação **JWT** e autorização por perfil (RF-01) ficam para sprint dedicada; a OpenAPI já documenta `BearerAuth`.

---

## Estrutura do repositório

```
.
├── docker-compose.yml      # MongoDB 7 (contentor greenherb-mongodb)
├── openapi.yaml           # Contrato OpenAPI para Swagger / relatório
├── package.json
├── src/
│   ├── app.js             # Express, rotas /api/v1/*
│   ├── server.js          # Bootstrap + dotenv + listen
│   ├── config/db.js       # Ligação Mongoose (usa variáveis de .env.example)
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── middlewares/
│   └── utils/
├── docs/                   # Sprint 1: matriz RF↔rotas, checklist validação
├── GREENHERB_Template_LaTeX/   # relatório LaTeX (template)
├── Enunciado.pdf
├── .env.example            # Template de ambiente (**nunca** commitar `.env`)
└── README.md
```

---

## Pré-requisitos

- **Node.js** v20+
- **Docker Desktop** (recomendado para MongoDB) ou MongoDB 7 instalado manualmente

---

## 1. MongoDB com Docker (recomendado)

No diretório do projeto existe um **`docker-compose.yml`** que levanta o **MongoDB 7** com:

- Contentor nomeado **`greenherb-mongodb`**
- **Porta do host:** `27018` → `27017` no contentor *(evita conflito se já tiveres outro Mongo em `localhost:27017` — na tua máquina aparecem contentores tipo `lab-node-03-mongodb` e `mediagrab-mongo` também com imagem mongo.)*
- Volume persistente **`greenherb-mongo-data`**
- `MONGO_INITDB_DATABASE=greenherb` *(inicialização padrão; a BD aparece mesmo quando há primeiros dados)*

```bash
# Levantar o MongoDB em segundo plano
npm run docker:up
# ou: docker compose up -d

npm run docker:ps    # estado do serviço
npm run docker:logs  # logs só do MongoDB
```

Para parar *(os dados ficam no volume Docker)*:

```bash
npm run docker:down
# ou: docker compose down
```

---

## 2. Variáveis de ambiente

1. Copia o template e edita só o que precisares:

```bash
cp .env.example .env
```

2. **`MONGODB_URI`** deve terminar em **`/greenherb`** — esse é o nome da base usada pela aplicação.

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `NODE_ENV` | Não | `development`, `production` ou `test` |
| `PORT` | Não | Porta HTTP (default **3000**) |
| `MONGODB_URI` | Sim | URI completa, ex.: `mongodb://127.0.0.1:27018/greenherb` |
| `MONGODB_SERVER_SELECTION_TIMEOUT_MS` | Não | Timeout Mongoose ao descobrir o servidor (default **5000**) |

Sempre que o código usar **nova** variável, actualiza primeiro **`.env.example`** e documenta aqui nesta secção.

---

## 3. Instalar dependências e correr a API

```bash
npm install

# servidor com reload automático em desenvolvimento
npm run dev

# modo produção (sem nodemon)
npm start
```

- Health check: [`http://localhost:3000/health`](http://localhost:3000/health)  
- API (prefixo definido na OpenAPI): **`http://localhost:3000/api/v1`**

---

## 4. Ligadura à BD (`src/config/db.js`)

- Lê **`MONGODB_URI`** do ambiente *(carregado por `dotenv` em [`src/server.js`](src/server.js) antes da ligação)*.
- Aplica **`MONGODB_SERVER_SELECTION_TIMEOUT_MS`** opcional conforme `.env.example`.
- `strictQuery` activo no Mongoose.
- **`disconnectFromDatabase()`** disponível para testes ou graceful shutdown futuro.

---

## 5. Recursos REST (resumo)

Base: `http://localhost:3000/api/v1`

| Prefixo | Descrição |
|---------|-----------|
| `/users` | CRUD utilizadores *(DELETE = desativa)* |
| `/herbs` | Ervas + `POST /herbs/import` *(placeholder)* |
| `/cultivation-plans` | Planos `regular` \| `emergencia` \| `pontual` |
| `/batches` | Lotes, associar plano, split, perdas, produtividade, plan vs actual |
| `/tasks` | Tarefas e conclusão |
| `/measurements` | Medições e geração de alertas |
| `/alerts` | Consulta, resolver, ignorar *(justificação)* |
| `/automation` | Modo `manual` \| `automatico` |
| `/reports` | Export CSV (`format=csv`; XLSX ainda não implementado) |
| `/audit-logs` | Auditoria |

Operações relevantes aceitam o header opcional **`x-actor-id`** para rastrear quem efectuou a acção nos logs.

Detalhes de schemas e códigos de resposta: ver **[`openapi.yaml`](openapi.yaml)** (importar em Swagger UI / Swagger Editor).

---

## 6. Documentação complementar no repositório

- [`docs/rf-endpoints-mapping.md`](docs/rf-endpoints-mapping.md) · matriz requisitos → rotas  
- [`docs/sprint1-validation-checklist.md`](docs/sprint1-validation-checklist.md) · checklist OpenAPI Sprint 1  
- **[`GREENHERB_Template_LaTeX/`](GREENHERB_Template_LaTeX/)** · relatório de projeto

---

## 7. Problemas comuns

| Sintoma | Causa provável |
|--------|----------------|
| `MONGODB_URI nao definido` | Falta `.env` ou cópia a partir de `.env.example`. |
| `ECONNREFUSED` / timeout | Mongo não está a correr: `npm run docker:up` ou **porta certa** (27018 com este compose vs 27017 nativo). |
| Porta 27018 ocupada | Edita em `docker-compose.yml` os mapeamentos de portos e igual no `.env`. |

---

## Licença

MIT (ver [`package.json`](package.json)).
