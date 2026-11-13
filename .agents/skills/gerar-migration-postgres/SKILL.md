---
name: gerar-migration-postgres
description: "Gera arquivos de migration PostgreSQL seguindo as boas práticas do agente de banco de dados DevKit: nomenclatura, UUID, TIMESTAMPTZ, constraints nomeadas, índices e triggers de updated_at. Use quando: criar uma nova tabela, alterar schema existente, adicionar índice ou constraint."
---

# Gerar Migration PostgreSQL

## Quando Usar

- Sempre que uma nova entidade precisar de tabela no banco
- Ao adicionar colunas, índices, constraints ou relacionamentos
- Antes de qualquer implementação de repositório no backend

## Convenções Obrigatórias

Toda migration gerada deve seguir:

| Convenção | Regra |
|---|---|
| PK | `UUID PRIMARY KEY DEFAULT gen_random_uuid()` |
| Timestamps | `TIMESTAMPTZ NOT NULL DEFAULT NOW()` |
| Constraints | Sempre nomeadas: `CONSTRAINT fk_<tabela>_<ref> FOREIGN KEY ...` |
| Índices | `CREATE INDEX CONCURRENTLY` para produção |
| Trigger updated_at | Sempre presente em tabelas mutáveis |
| Nomes de tabela | snake_case, plural |
| Nomes de coluna | snake_case |

## Procedimento

### Passo 1 — Identificar o escopo

Determine o que será criado ou alterado:
- Nova tabela → use template `CREATE TABLE`
- Nova coluna → use `ALTER TABLE ... ADD COLUMN`
- Novo índice → use `CREATE INDEX CONCURRENTLY`
- Novo relacionamento → adicione FK com constraint nomeada

### Passo 2 — Nomear o arquivo

Use o padrão: `V{número}__{descricao_snake_case}.sql`

Exemplos:
```
V1__create_users_table.sql
V2__create_orders_table.sql
V3__add_status_index_to_orders.sql
V4__add_payment_method_to_orders.sql
```

### Passo 3 — Escrever a migration

#### Template: Nova tabela

```sql
-- V{n}__{nome}_table.sql

-- Habilitar extensão UUID se ainda não estiver ativa
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE {nome_tabela} (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    -- colunas de negócio aqui
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para atualização automática de updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_{nome_tabela}_updated_at
BEFORE UPDATE ON {nome_tabela}
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Comentário na tabela
COMMENT ON TABLE {nome_tabela} IS '{descrição da tabela}';
```

#### Template: Tabela com FK

```sql
CREATE TABLE order_items (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id    UUID        NOT NULL,
    product_id  UUID        NOT NULL,
    quantity    INTEGER     NOT NULL CHECK (quantity > 0),
    unit_price  NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

CREATE INDEX idx_order_items_order_id ON order_items (order_id);
CREATE INDEX idx_order_items_product_id ON order_items (product_id);
```

#### Template: Coluna com ENUM

```sql
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');

ALTER TABLE orders
    ADD COLUMN status order_status NOT NULL DEFAULT 'pending';

-- Índice parcial para pedidos ativos (otimiza queries frequentes)
CREATE INDEX idx_orders_active_status
    ON orders (status, created_at DESC)
    WHERE status NOT IN ('delivered', 'cancelled');
```

#### Template: Adicionar coluna

```sql
-- V{n}__add_{coluna}_to_{tabela}.sql

ALTER TABLE {tabela}
    ADD COLUMN {coluna} {tipo} {nullable} {default};

-- Backfill se necessário
-- UPDATE {tabela} SET {coluna} = {valor} WHERE {coluna} IS NULL;

-- Adicionar NOT NULL constraint separada após backfill
-- ALTER TABLE {tabela} ALTER COLUMN {coluna} SET NOT NULL;
```

#### Template: Índice em produção

```sql
-- CONCURRENTLY evita lock na tabela em produção
-- Deve ser executado fora de uma transaction block
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_{tabela}_{coluna}
    ON {tabela} ({coluna});

-- Índice parcial (mais eficiente para subsets frequentes)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_{tabela}_{coluna}_active
    ON {tabela} ({coluna})
    WHERE status = 'active';
```

### Passo 4 — Escrever o rollback

Sempre que criar uma migration, crie o rollback correspondente:

```sql
-- rollback de V{n}
DROP TABLE IF EXISTS {tabela} CASCADE;
DROP TYPE IF EXISTS {enum_type};
DROP FUNCTION IF EXISTS update_updated_at();
```

### Passo 5 — Validar pontos críticos

Antes de finalizar, revise:
- [ ] Todas as FKs têm constraint nomeada
- [ ] Todas as PKs usam UUID + gen_random_uuid()
- [ ] Todos os timestamps são TIMESTAMPTZ
- [ ] Tabelas mutáveis têm trigger de updated_at
- [ ] Índices para colunas usadas em WHERE, JOIN ou ORDER BY
- [ ] CHECKs para domínios restritos (status, quantidade, preço)
- [ ] Nenhuma credencial ou dado sensível no arquivo

## Output Esperado

- Arquivo(s) de migration criados em `infra/database/migrations/` (ou caminho equivalente da stack)
- Arquivo de rollback correspondente
- Breve comentário no topo de cada arquivo explicando o propósito da migration
