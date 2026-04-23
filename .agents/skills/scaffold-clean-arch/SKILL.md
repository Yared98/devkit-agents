---
name: scaffold-clean-arch
description: "Gera a estrutura de pastas e arquivos base seguindo Clean Architecture (Robert C. Martin) adaptada à stack escolhida. Use quando: arquitetura foi definida e é hora de criar a estrutura física do projeto, qualquer linguagem (Node.js, Python, Java, Go)."
user-invocable: true
---

# Scaffold Clean Architecture

## Quando Usar

- Logo após a decisão arquitetural do `DevKit-arquitetura`
- Quando o usuário pedir para "criar a estrutura do projeto"
- Antes de qualquer implementação de código de negócio

## Princípio

A Regra da Dependência deve ser refletida na estrutura de pastas: camadas internas nunca importam das externas. A estrutura física é a primeira defesa contra violações arquiteturais.

```
Entities → Use Cases → Interface Adapters → Frameworks & Drivers
(mais interno)                               (mais externo)
```

## Procedimento

### Passo 1 — Confirmar stack

Identifique a linguagem e framework antes de criar qualquer arquivo. Se não estiver claro, pergunte.

### Passo 2 — Criar estrutura base

Crie a estrutura conforme a stack identificada:

#### Node.js / TypeScript (NestJS, Express, Fastify)
```
src/
├── domain/
│   ├── entities/
│   └── value-objects/
├── application/
│   ├── use-cases/
│   └── interfaces/
│       ├── repositories/
│       └── services/
├── adapters/
│   ├── controllers/
│   ├── gateways/
│   └── presenters/
├── infra/
│   ├── database/
│   │   └── repositories/
│   ├── http/
│   └── external/
└── shared/
    ├── errors/
    └── types/
```

#### Python (FastAPI, Django, Flask)
```
src/
├── domain/
│   ├── entities/
│   └── value_objects/
├── application/
│   ├── use_cases/
│   └── interfaces/
│       ├── repositories/
│       └── services/
├── adapters/
│   ├── controllers/
│   ├── gateways/
│   └── presenters/
├── infra/
│   ├── database/
│   │   └── repositories/
│   ├── http/
│   └── external/
└── shared/
    ├── errors/
    └── types/
```

#### Java (Spring Boot / Quarkus)
```
src/main/java/{package}/
├── domain/
│   ├── entity/
│   └── valueobject/
├── application/
│   ├── usecase/
│   └── port/
│       ├── in/
│       └── out/
├── adapter/
│   ├── in/
│   │   └── web/
│   └── out/
│       └── persistence/
└── infrastructure/
    ├── config/
    ├── persistence/
    └── external/
```

#### Go
```
internal/
├── domain/
│   ├── entity/
│   └── valueobject/
├── application/
│   ├── usecase/
│   └── port/
├── adapter/
│   ├── handler/
│   └── repository/
└── infra/
    ├── database/
    └── http/
cmd/
└── server/
    └── main.go
```

### Passo 3 — Criar arquivos de índice/barrel

Para Node.js/TypeScript, crie `index.ts` em cada pasta como barrel de exportação.
Para Python, crie `__init__.py` em cada pasta.
Para Java/Go, não é necessário.

### Passo 4 — Criar arquivo de exemplo de entidade

Crie um arquivo de entidade de exemplo comentado para guiar a convenção:

**TypeScript:**
```typescript
// domain/entities/example.entity.ts
// Entities contêm apenas regras de negócio puras.
// Sem imports de frameworks, ORMs ou infra.
export class ExampleEntity {
  private constructor(
    public readonly id: string,
    public readonly name: string,
  ) {}

  static create(name: string): ExampleEntity {
    if (!name || name.trim().length === 0) {
      throw new Error('Name is required');
    }
    return new ExampleEntity(crypto.randomUUID(), name.trim());
  }
}
```

**Python:**
```python
# domain/entities/example_entity.py
# Entities contêm apenas regras de negócio puras.
# Sem imports de frameworks, ORMs ou infra.
from dataclasses import dataclass
from uuid import uuid4

@dataclass(frozen=True)
class ExampleEntity:
    id: str
    name: str

    @classmethod
    def create(cls, name: str) -> "ExampleEntity":
        if not name or not name.strip():
            raise ValueError("Name is required")
        return cls(id=str(uuid4()), name=name.strip())
```

### Passo 5 — Criar interface de repositório de exemplo

Crie um contrato de repositório na camada `application/interfaces/repositories/` para demonstrar como a camada de domínio se comunica com a infra sem depender dela:

**TypeScript:**
```typescript
// application/interfaces/repositories/example.repository.ts
import { ExampleEntity } from '@/domain/entities/example.entity';

export interface ExampleRepository {
  findById(id: string): Promise<ExampleEntity | null>;
  save(entity: ExampleEntity): Promise<void>;
  delete(id: string): Promise<void>;
}
```

## Output Esperado

- Estrutura de pastas criada no workspace
- Arquivo de entidade de exemplo em `domain/entities/`
- Interface de repositório de exemplo em `application/interfaces/repositories/`
- Nenhum código de negócio real — apenas o esqueleto comentado
