# DevKit — Workspace de Desenvolvimento Multi-Agente

Este projeto usa um sistema de agentes especializados para desenvolvimento de aplicações completas. Os agentes são definidos em `.github/agents/` e ativados via slash commands em `.claude/commands/`.

---

## Estrutura de Arquivos

```
.github/
  agents/          ← definições de cada agente especializado (.agent.md)
  hooks/           ← protocolo detalhado de cada lifecycle hook
  brand/           ← guia de identidade visual (guide.txt)
.claude/
  commands/        ← slash commands que ativam cada agente no Claude Code
.DevKit/
  context.md       ← Context Bank: estado vivo do projeto (criado na primeira sessão)
```

---

## Como Ler e Executar um Agente

Quando um slash command é invocado (ex: `/orquestrador`), leia o `.agent.md` correspondente em `.github/agents/` e aja integralmente conforme suas instruções, constraints, stack padrão e abordagem.

O arquivo `.agent.md` é a fonte de verdade do comportamento do agente. Nunca ignore suas constraints.

---

## Protocolo de Sub-agentes (Agent Tool)

Quando o orquestrador precisar invocar um sub-agente especializado, use a ferramenta `Agent` com `subagent_type: "general-purpose"`. Monte o prompt do sub-agente assim:

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

Os hooks são executados **por você** (não por sub-agentes separados), lendo os arquivos de referência em `.github/hooks/`:

| Hook | Quando executar | Arquivo de referência |
|---|---|---|
| PRE_TASK | Antes de cada delegação para sub-agente | `.github/hooks/PRE_TASK.md` |
| POST_IMPLEMENT | Após o sub-agente concluir a implementação | `.github/hooks/POST_IMPLEMENT.md` |
| POST_VALIDATE | Após PASS ou FAIL_FIXABLE resolvido do tester | `.github/hooks/POST_VALIDATE.md` |
| POST_SESSION | Ao encerrar a sessão (usuário sinaliza "commita", "pronto", etc.) | `.github/hooks/POST_SESSION.md` |

**Fluxo por camada:**
```
PRE_TASK → sub-agente → POST_IMPLEMENT → (se PASS) POST_VALIDATE → próxima camada
```

Se POST_IMPLEMENT retornar `FAIL_BLOCKED`: pare, informe o usuário e aguarde instrução.

---

## Context Bank

O estado do projeto é mantido em `.DevKit/context.md`. Se não existir, crie-o antes da primeira delegação com estas seções:

```markdown
# Context Bank — {nome do projeto}

## Estado por Camada (Hooks Status)
| Camada | Status | Agente | Última atualização |
|---|---|---|---|
| Arquitetura | ⏳ Não Iniciado | — | — |
| Banco de Dados | ⏳ Não Iniciado | — | — |
| Backend | ⏳ Não Iniciado | — | — |
| Frontend | ⏳ Não Iniciado | — | — |
| Infra/SRE | ⏳ Não Iniciado | — | — |
| Documentação | ⏳ Não Iniciado | — | — |

## Decisões Arquiteturais
(vazio — será preenchido conforme decisões forem tomadas)

## Libs Adotadas
(vazio)

## Restrições e Convenções
(vazio)

## O Que Já Foi Tentado (Não Repetir)
| O que foi tentado | Resultado | Erro encontrado | O que resolveu |
|---|---|---|---|

## Perguntas em Aberto
(vazio)

## Log de Execução (Hook Events)
| Data/Hora | Agente | Ação | Arquivos | Status |
|---|---|---|---|---|

## Histórico de Validações (Tester)
| Feature validada | Status | Pendências | Data |
|---|---|---|---|

## Próximos Passos
- Iniciar com DevKit-arquitetura
```

---

## Identidade Visual

Consulte `.github/brand/guide.txt` antes de criar qualquer interface (Views, componentes, Layouts).

---

## Regras Globais

- Sempre inspecione a estrutura atual do projeto antes de planejar — nunca assuma que está vazio.
- Nunca pule o PRE_TASK: o Context Brief é o contrato de contexto entre agentes.
- FAIL_BLOCKED para tudo — não avance sem resolução do usuário.
- Ao final de qualquer entrega, execute o POST_SESSION e apresente o git workflow ao usuário antes de confirmar.
