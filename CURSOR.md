# DevKit — Workspace de Desenvolvimento Multi-Agente (Cursor)

Este projeto usa um sistema de agentes especializados para desenvolvimento de aplicações completas. Os agentes são definidos em `.github/agents/` e ativados via **rules** em `.cursor/rules/`, **Custom Modes** ou menção `@` no chat.

---

## Estrutura de Arquivos

```
.github/
  agents/          ← definições de cada agente especializado (.agent.md)
  hooks/           ← protocolo detalhado de cada lifecycle hook
  skills/          ← skills originais do DevKit
  brand/           ← guia de identidade visual (guide.txt)
.cursor/
  rules/           ← rules @-mentionáveis por agente (*.mdc)
  skills/          ← cópia das skills (gerada por scripts/sync-cursor-skills.ps1)
  COMO-USAR.md     ← guia de uso no Cursor
.DevKit/
  context.md       ← Context Bank: estado vivo do projeto (criado na primeira sessão)
AGENTS.md          ← lido automaticamente pelo Cursor em toda sessão
```

---

## Como Ler e Executar um Agente

Quando uma rule é invocada (ex: `@devkit-orquestrador`) ou um Custom Mode é selecionado, leia o `.agent.md` correspondente em `.github/agents/` e aja integralmente conforme suas instruções, constraints, stack padrão e abordagem.

O arquivo `.agent.md` é a fonte de verdade do comportamento do agente. Nunca ignore suas constraints.

---

## Protocolo de Sub-agentes (Task Tool)

Quando o orquestrador precisar invocar um sub-agente especializado, use a ferramenta **Task** com `subagent_type: "generalPurpose"`. Monte o prompt do sub-agente assim:

```
[INSTRUÇÕES DO AGENTE]
Leia e siga integralmente o arquivo `.github/agents/<nome>.agent.md`.
Conteúdo do arquivo:
---
{conteúdo completo do .agent.md}
---

[CONTEXT BRIEF — PRE_TASK]
{Context Brief gerado a partir de .DevKit/context.md}

[TAREFA]
{descrição específica da tarefa}

[CONTEXTO DO PROJETO]
- Estrutura atual: {resultado de inspeção de pastas/arquivos relevantes}
- Contrato de API: {conteúdo de docs/contracts/ se existir}
- Stack confirmada: {linguagem, framework, banco}
```

O sub-agente executa de forma isolada e retorna o resultado. Avalie o output e continue o fluxo de hooks.

---

## Lifecycle Hooks — Protocolo Obrigatório

Os hooks são executados **por você**, lendo os arquivos em `.github/hooks/`:

| Hook | Quando executar | Arquivo |
|---|---|---|
| PRE_TASK | Antes de cada delegação | `.github/hooks/PRE_TASK.md` |
| POST_IMPLEMENT | Após implementação | `.github/hooks/POST_IMPLEMENT.md` |
| POST_VALIDATE | Após PASS do tester | `.github/hooks/POST_VALIDATE.md` |
| POST_SESSION | Ao encerrar sessão | `.github/hooks/POST_SESSION.md` |

Fluxo: `PRE_TASK → sub-agente → POST_IMPLEMENT → POST_VALIDATE → próxima camada`

Se POST_IMPLEMENT retornar `FAIL_BLOCKED`: pare, informe o usuário e aguarde instrução.

---

## Context Bank

Estado do projeto em `.DevKit/context.md`. Se não existir, crie antes da primeira delegação (template completo em `CURSOR.md` ou skill `project-context-bank`).

---

## Skills

Skills em `.cursor/skills/<nome>/SKILL.md`. Invoque com `@scaffold-clean-arch`, `@revisao-owasp`, etc.

Sincronizar de `.github/skills/`:
```powershell
./scripts/sync-cursor-skills.ps1
```

---

## Regras Globais

- Inspecione o projeto antes de planejar
- Nunca pule PRE_TASK
- FAIL_BLOCKED para tudo até resolução do usuário
- POST_SESSION ao encerrar
