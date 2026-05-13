# UBI-ProgramacaoNoServidor

Implementacao inicial do backend Node.js + MongoDB para a Sprint 2, com foco nos endpoints de planos de cultivo definidos no `openapi.yaml`.

## Requisitos

- Node.js 20+
- MongoDB 7+ (local ou remoto)

## Configuracao

1. Copiar o ficheiro de exemplo:

```bash
cp .env.example .env
```

2. Ajustar variaveis no `.env`:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/greenherb
```

3. Instalar dependencias:

```bash
npm install
```

4. Iniciar em desenvolvimento:

```bash
npm run dev
```

## Endpoints implementados (Sprint 2 - fase inicial)

Base URL: `http://localhost:3000/api/v1`

- `POST /herbs` - cria uma erva aromatica (suporte para associacao em planos)
- `GET /cultivation-plans` - lista planos (filtro opcional por `type`)
- `POST /cultivation-plans` - cria plano de cultivo (`regular`, `emergencia`, `pontual`)
- `GET /cultivation-plans/{planId}` - consulta plano por ID
- `PATCH /cultivation-plans/{planId}` - atualiza plano
- `DELETE /cultivation-plans/{planId}` - remove plano

## Regras de negocio aplicadas na criacao de planos

- Plano `regular` exige `regularConfig` completo:
  - `temperature`, `humidity`, `luminosity` (com `min` e `max`)
  - `irrigation` (`frequencyHours`, `amountMl`)
  - `fertilization` (`frequencyDays`, `dosage`)
  - `expectedDurationDays`
- Plano `emergencia` exige `emergencyConfig` completo:
  - `minIntervalMinutes`, `interventionType`, `intensityOrDosage`
- Plano `pontual` exige `pontualConfig` com aprovacao:
  - `interventionType`, `intensityOrDosage`
  - `approval.approvedBy` e `approval.approvedAt`

## Nota

O mecanismo de autenticacao/autorizacao (JWT e perfis) permanece para a proxima etapa, conforme acordado na Sprint 1.