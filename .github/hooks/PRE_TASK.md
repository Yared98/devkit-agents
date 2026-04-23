# Hook: PRE_TASK

Executado pelo `DevKit-cerebro` **antes de qualquer delegação** para um sub-agente.

---

## Quando Executar

- Sempre que o orquestrador estiver prestes a invocar um sub-agente especializado
- Antes de qualquer delegação — arquitetura, banco, backend, frontend, SRE ou documentação
- Mesmo que `.DevKit/context.md` ainda não exista (ver seção Ausência de Context Bank)

---

## O Que Ler

1. Leia `.DevKit/context.md` na íntegra
2. Priorize as seguintes seções (ordem de importância):
   - `## Estado por Camada (Hooks Status)` — o que já está concluído vs. pendente
   - `## Decisões Arquiteturais` — decisões que NÃO devem ser reabertas
   - `## O Que Já Foi Tentado (Não Repetir)` — abordagens que falharam
   - `## Libs Adotadas` — bibliotecas já confirmadas (não sugira alternativas)
   - `## Restrições e Convenções` — regras que todos os agentes devem respeitar
   - `## Perguntas em Aberto` — conflitos ou dúvidas não resolvidos

---

## O Que Produzir

Gere um **Context Brief** estruturado. Ele será incluído **no início do prompt de delegação** para o sub-agente.

### Formato do Context Brief

```
## Context Brief — {nome do agente} | {data}

### Estado do Projeto
- Banco de Dados: {✅ Concluído | 🔄 Em Progresso | ⏳ Não Iniciado | ❌ Bloqueado}
- Backend: {status}
- Frontend: {status}
- Infra/SRE: {status}

### Decisões que NÃO reabrir
- {ex: "PostgreSQL definido como banco — MongoDB descartado"}
- {ex: "Stack: Rust + Axum + SQLx"}

### Libs Adotadas (não substitua)
- {lib + versão confirmada}

### O que NÃO fazer (tentativas que falharam)
- {ex: "Não usar Diesel — incompatível com async escolhido"}

### Restrições Ativas
- {ex: "UUID como PK em todas as tabelas"}
- {ex: "TIMESTAMPTZ em todos os campos de data"}

### Perguntas em Aberto
- {conflitos ou decisões pendentes, se houver — caso contrário: "(nenhuma)"}

### Contexto Específico para Esta Tarefa
- Agente-alvo: {nome do agente}
- Tarefa: {descrição breve do que vai ser feito}
- Dependências: {o que já existe que este agente precisa saber}
```

---

## Ausência de Context Bank

Se `.DevKit/context.md` não existir:

1. Emita: `[PRE_TASK] Context bank não encontrado.`
2. Instrua o orquestrador a criar o context bank com a skill `project-context-bank` **antes** de continuar
3. Não gere o Context Brief até que o arquivo seja criado

---

## Exemplo de Output Completo

```
## Context Brief — DevKit-rust-backend | 2026-04-20 14:32

### Estado do Projeto
- Banco de Dados: ✅ Concluído
- Backend: ⏳ Não Iniciado
- Frontend: ⏳ Não Iniciado
- Infra/SRE: ⏳ Não Iniciado

### Decisões que NÃO reabrir
- Banco: PostgreSQL (MySQL e MongoDB descartados)
- ORM/query: SQLx 0.8 sem ORM (Diesel descartado por incompatibilidade async)
- Runtime: Tokio — não substituir por async-std

### Libs Adotadas (não substitua)
- axum 0.8
- sqlx 0.8 (features: postgres, runtime-tokio, uuid, chrono)
- uuid 1.x com feature v4
- chrono 0.4

### O que NÃO fazer
- Não usar Diesel (tentado na sessão anterior, incompatível com async)
- Não usar String como PK — todas as PKs são UUID

### Restrições Ativas
- UUID como PK em todas as entidades
- TIMESTAMPTZ em todos os campos de data (created_at, updated_at)
- Migrations SQLx: formato {n}_{nome}.sql

### Perguntas em Aberto
- (nenhuma)

### Contexto Específico para Esta Tarefa
- Agente-alvo: DevKit-rust-backend
- Tarefa: implementar endpoints POST /users e GET /users/:id
- Dependências: migration 1_init.sql criada (tabela users com id UUID, name, email, created_at, updated_at)
```
