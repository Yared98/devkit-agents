---
name: contrato-api
description: "Define e documenta os contratos de API REST entre camadas (frontend ↔ backend) e entre use cases e repositórios. Use quando: arquitetura foi definida e é preciso alinhar o que o backend expõe com o que o frontend consome, ou quando precisar formalizar as interfaces entre camadas internas."
user-invocable: true
---

# Definição de Contrato de API

## Quando Usar

- Logo após o agente de arquitetura definir os módulos da aplicação
- Antes do agente de backend implementar os endpoints
- Antes do agente de frontend começar a integração
- Quando houver dúvida sobre o que uma camada expõe para outra

## Tipos de Contrato

### 1. Contrato HTTP (Frontend ↔ Backend)

Define endpoints, métodos, bodies, responses e erros.

### 2. Contrato de Porta (Use Case ↔ Repositório)

Define as interfaces que o repositório deve implementar para cada use case.

---

## Procedimento

### Passo 1 — Identificar os módulos

Liste os módulos/funcionalidades que precisam de contrato. Para cada um, identifique:
- Quais operações existem (criar, buscar, atualizar, deletar, listar)
- Quem produz (backend) e quem consome (frontend ou outro serviço)
- Quais dados trafegam em cada direção

### Passo 2 — Definir contratos HTTP

Use o template abaixo para cada endpoint:

```
### {MÉTODO} {path}

**Descrição:** {O que esta operação faz}
**Autenticação:** Requer Bearer Token | Pública

**Path params:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | uuid | ✅ | ID do recurso |

**Query params:**
| Parâmetro | Tipo | Obrigatório | Default | Descrição |
|---|---|---|---|---|
| page | integer | ❌ | 1 | Página |
| limit | integer | ❌ | 20 | Itens por página |

**Request body:**
{Somente para POST, PUT, PATCH}
| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| email | string | ✅ | Email do usuário |
| password | string | ✅ | Senha (min 8 chars) |

**Responses:**

`200 OK`
\`\`\`json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2026-04-12T10:00:00Z"
}
\`\`\`

`400 Bad Request`
\`\`\`json
{
  "error": "VALIDATION_ERROR",
  "message": "Email is required",
  "fields": { "email": "required" }
}
\`\`\`

`401 Unauthorized`
\`\`\`json
{
  "error": "INVALID_CREDENTIALS",
  "message": "Invalid email or password"
}
\`\`\`
```

### Passo 3 — Padrão de respostas de erro

Todo contrato deve usar o mesmo envelope de erro:

```typescript
// Formato padrão de erro
interface ApiError {
  error: string;        // Código de erro em SCREAMING_SNAKE_CASE
  message: string;      // Mensagem legível para o desenvolvedor
  fields?: Record<string, string>; // Para erros de validação
}
```

Códigos de erro padrão:

| Código HTTP | error | Quando usar |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Input inválido |
| 401 | `UNAUTHORIZED` | Sem token ou token inválido |
| 403 | `FORBIDDEN` | Token válido, sem permissão |
| 404 | `NOT_FOUND` | Recurso não existe |
| 409 | `CONFLICT` | Recurso já existe (email duplicado, etc.) |
| 422 | `UNPROCESSABLE` | Dados válidos mas regra de negócio violada |
| 500 | `INTERNAL_ERROR` | Erro interno — não expor detalhes |

### Passo 4 — Definir contratos de porta (Use Case ↔ Infra)

Para cada use case que acessa dados, defina a interface:

```typescript
// application/interfaces/repositories/user.repository.ts

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
  update(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}
```

```python
# application/interfaces/repositories/user_repository.py
from abc import ABC, abstractmethod
from typing import Optional
from domain.entities.user import User

class UserRepository(ABC):
    @abstractmethod
    async def find_by_id(self, id: str) -> Optional[User]: ...
    
    @abstractmethod
    async def find_by_email(self, email: str) -> Optional[User]: ...
    
    @abstractmethod
    async def save(self, user: User) -> None: ...
```

### Passo 5 — Salvar o contrato

Salve o contrato em:
```
docs/contracts/{modulo}-api-contract.md
```

Este arquivo será a referência para o agente de backend implementar e o agente de frontend integrar.

## Regras do Contrato

- Campos de data sempre em ISO 8601 UTC: `"2026-04-12T10:00:00Z"`
- IDs sempre como `string` (UUID) — nunca expor IDs numéricos sequenciais
- Campos opcionais ausentes não são enviados (evitar `null` explícito quando possível)
- Paginação sempre com `{ data: [], total: number, page: number, limit: number }`
- Enums em `camelCase` no JSON: `"paymentMethod": "creditCard"`

## Output Esperado

- Arquivo `docs/contracts/{modulo}-api-contract.md` criado no workspace
- Lista de endpoints com método, path, auth e descrição
- Schemas de request/response para cada endpoint
- Interfaces de repositório criadas em `application/interfaces/`
- Tabela de resumo de todos os endpoints do módulo
