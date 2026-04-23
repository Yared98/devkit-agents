# DevKit — Instruções para o Copilot

Estas instruções se aplicam a todo o repositório `devkit-agents` e devem ser seguidas ao criar ou editar qualquer agente, skill ou arquivo de configuração.

---

## Front Matter de Agentes (.agent.md)

### Campos obrigatórios e ordem

```yaml
---
name: "Nome do Agente"
description: "Descrição do agente."
tools: [read, search, edit, execute, todo]
user-invocable: true
---
```

### Regras de YAML — crítico para compatibilidade no Windows

O parser YAML do Copilot CLI no Windows (Go yaml.v3 strict mode) é mais restritivo que o Linux. Siga estas regras em todos os arquivos de front matter:

#### 1. Nunca use aspas simples dentro de valores com aspas duplas

```yaml
# ❌ quebra no Windows
description: "Use quando (ex: 'API REST em Node.js')"

# ✅ correto
description: "Use quando, ex: API REST em Node.js"
```

#### 2. Campos com valores contendo hífens usam lista em bloco, não array inline

```yaml
# ❌ quebra no Windows — hífens nos valores causam parse error
agents: [devkit-java-backend, devkit-rust-backend]

# ✅ correto — lista em bloco
agents:
  - devkit-java-backend
  - devkit-rust-backend
```

#### 3. Arrays de strings simples (sem hífen nos valores) podem usar inline

```yaml
# ✅ valores sem hífen — inline é seguro
tools: [read, search, edit, execute, todo]
```

#### 4. O campo `argument-hint` está proibido

Esse campo causa `Unexpected scalar at node end` no parser do Windows independente do conteúdo. Não use.

```yaml
# ❌ proibido
argument-hint: "Qualquer texto aqui"
```

---

## Template de Novo Agente

Use este template ao criar qualquer novo arquivo `.github/agents/*.agent.md`:

```yaml
---
name: "DevKit NomeDoAgente"
description: "Descrição objetiva de quando usar este agente. Ative quando: casos de uso principais."
tools: [read, search, edit, execute, todo]
user-invocable: true
---

Você é o agente NomeDoAgente do DevKit. [Descrição da identidade e responsabilidade principal.]

## Responsabilidades

- [Responsabilidade 1]
- [Responsabilidade 2]

## Abordagem

1. [Passo 1]
2. [Passo 2]

## Constraints

- NÃO [restrição importante]

## Output Esperado

- [O que o agente produz ao concluir uma tarefa]
```

### Agentes que delegam para sub-agentes

Quando o agente precisa invocar outros agentes, adicione `agent` ao `tools` e declare `agents` como lista em bloco:

```yaml
---
name: "DevKit NomeDoAgente"
description: "Descrição."
tools: [agent, read, search, edit, execute, todo]
user-invocable: true
agents:
  - devkit-subagente-a
  - devkit-subagente-b
---
```

---

## Template de Nova Skill

Use este template ao criar qualquer novo arquivo `.github/skills/*/SKILL.md`:

```yaml
---
name: nome-da-skill
description: "Descrição objetiva da skill. Use quando: casos de uso."
user-invocable: true
---

# Título da Skill

## Quando Usar

[Condições que devem estar presentes para invocar esta skill]

## Procedimento

### Passo 1 — [Título]

[Descrição e exemplos]

## Output Esperado

[O que a skill produz ao ser executada]
```

---

## Git Workflow

Ao criar ou modificar agentes e skills, siga o padrão definido na skill `git-workflow`:

- Branch: `feat/<escopo>` para novos recursos, `fix/<escopo>` para correções
- Commit: `feat(agent): descrição imperativa` ou `feat(skill): descrição`
- Merge: sempre `--no-ff` com mensagem `merge(<escopo>): descrição`
- Atualizar o `README.md` quando um novo agente ou skill for adicionado
- Atualizar o `devkit-orquestrador.agent.md` quando um novo agente for criado

---

## Checklist antes de commitar um novo agente

- [ ] Front matter não contém `argument-hint`
- [ ] Campos com hífens nos valores usam lista em bloco (não array inline)
- [ ] Nenhuma aspa simples aninhada dentro de valor com aspas duplas
- [ ] Campo `description` é informativo e menciona quando ativar o agente
- [ ] Agente registrado no `devkit-orquestrador.agent.md` (lista `agents:`)
- [ ] Agente de implementação (backend/frontend/banco/sre): verificar se o ciclo de hooks se aplica (PRE_TASK + POST_IMPLEMENT + POST_VALIDATE via `devkit-cerebro` e `devkit-tester`)
- [ ] README atualizado com seção do novo agente na tabela de agentes e hierarquia
