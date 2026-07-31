# DevKit — Workspace de Desenvolvimento Multi-Agente (Cursor)

Este documento explica como utilizar o ecossistema DevKit **no Cursor IDE**, incluindo o protocolo que o Agent (LLM) deve seguir e o passo a passo de instalação — por projeto ou globalmente.

Diferente do GitHub Copilot (seletor de modo nativo) e do Claude Code (slash commands em `.claude/commands/`), o Cursor usa **rules** (`.cursor/rules/*.mdc`), **skills** (`.cursor/skills/`), **Custom Modes** e o arquivo `AGENTS.md` lido automaticamente em cada sessão.

> **Fonte de verdade compartilhada:** os arquivos `.github/agents/*.agent.md` e `.github/hooks/` são os mesmos usados por Copilot, Claude Code e Antigravity. Este documento descreve apenas a camada de adaptação Cursor.

---

## Índice

- [Estrutura de Arquivos](#estrutura-de-arquivos)
- [Instalação](#instalação)
- [Como Invocar Agentes](#como-invocar-agentes)
- [Protocolo para o LLM](#protocolo-para-o-llm)
- [Sub-agentes (Task Tool)](#sub-agentes-task-tool)
- [Lifecycle Hooks](#lifecycle-hooks)
- [Context Bank](#context-bank)
- [Skills](#skills)
- [Mapeamento de Agentes](#mapeamento-de-agentes)
- [Scripts de Manutenção](#scripts-de-manutenção)
- [Comparação com Outros Ambientes](#comparação-com-outros-ambientes)

---

## Estrutura de Arquivos

```text
AGENTS.md                          ← lido automaticamente pelo Cursor em toda sessão
CURSOR.md                          ← este documento (protocolo + instalação)
toolkit.config.md                  ← configuração do projeto (nome, stack, brand)
.github/
  agents/          ← definições de cada agente especializado (.agent.md)
  hooks/           ← protocolo detalhado de cada lifecycle hook
  skills/          ← skills originais do DevKit (fonte)
  brand/           ← guia de identidade visual (guide.txt)
.cursor/
  rules/           ← rules @-mentionáveis por agente (*.mdc)
  skills/          ← cópia das skills (gerada por scripts/sync-cursor-skills.ps1)
  COMO-USAR.md     ← guia rápido de uso humano
.DevKit/
  context.md       ← Context Bank: estado vivo do projeto (criado na primeira sessão)
docs/
  contracts/       ← contratos HTTP entre frontend e backend
scripts/
  cursor-agent-map.json            ← mapa de agentes → rules
  generate-cursor-rules.ps1        ← regenera .cursor/rules/
  sync-cursor-skills.ps1           ← sincroniza .github/skills → .cursor/skills/
  setup-devkit-project.ps1         ← inicializa Context Bank em um projeto
  setup-cursor-global.ps1          ← instalação global (skills em ~/.cursor/skills/)
  generate-cursor-global-skills.ps1
```

---

## Instalação

### Opção A — Por projeto (recomendado para repos versionados)

Use quando o DevKit faz parte do repositório do seu projeto (como template ou submodule).

**1. Copie ou clone os arquivos DevKit para a raiz do projeto:**

```powershell
git clone https://github.com/Yared98/devkit-agents.git .devkit-temp
Copy-Item -Recurse .devkit-temp\.github .
Copy-Item -Recurse .devkit-temp\.cursor .
Copy-Item .devkit-temp\AGENTS.md .
Copy-Item .devkit-temp\CURSOR.md .
Copy-Item .devkit-temp\toolkit.config.md .
Copy-Item -Recurse .devkit-temp\scripts .
Remove-Item -Recurse -Force .devkit-temp
```

**2. Sincronize as skills para o formato Cursor:**

```powershell
./scripts/sync-cursor-skills.ps1
```

**3. Inicialize o Context Bank do projeto:**

```powershell
./scripts/setup-devkit-project.ps1 -ProjectPath .
```

Ou no chat do Cursor:

```
/devkit-init
```

**4. Edite `toolkit.config.md`** com nome, stack e identidade visual do projeto.

**5. Abra o projeto no Cursor** — `AGENTS.md` será lido automaticamente.

---

### Opção B — Instalação global (todos os repos)

Use quando quer usar o DevKit em qualquer projeto sem copiar arquivos para cada repo.

**1. Clone o DevKit em pasta fixa:**

```powershell
git clone https://github.com/Yared98/devkit-agents.git $env:USERPROFILE\.cursor\devkit-agents
```

**2. Execute o setup global:**

```powershell
& "$env:USERPROFILE\.cursor\devkit-agents\scripts\setup-cursor-global.ps1"
```

Isso copia skills e agentes para `~/.cursor/skills/` (disponíveis em todos os projetos).

**3. Por projeto, inicialize apenas o Context Bank local:**

```powershell
& "$env:USERPROFILE\.cursor\devkit-agents\scripts\setup-devkit-project.ps1" -ProjectPath "C:\caminho\do\projeto"
```

Ou no chat: `/devkit-init`

**4. (Opcional) User Rule global** — em **Customize → Rules → User Rules**:

```
Quando o usuário usar /devkit-* ou mencionar DevKit, siga os agentes em
~/.cursor/devkit-agents/.github/agents/ e hooks em .github/hooks/.
Context Bank sempre em .DevKit/context.md do projeto aberto.
Sub-agentes via Task tool. Leia CURSOR.md para protocolo completo.
```

---

### Opção C — Apenas copiar para projeto existente (mínimo)

Se o repositório já contém `.github/agents/` e você quer só a camada Cursor:

```powershell
./scripts/sync-cursor-skills.ps1
./scripts/generate-cursor-rules.ps1
./scripts/setup-devkit-project.ps1
```

---

### Verificar instalação

1. **Customize → Skills** — deve listar `devkit-orquestrador`, `scaffold-clean-arch`, etc.
2. **Customize → Rules** — deve listar rules em `.cursor/rules/` (modo Manual ou Agent Requested)
3. No chat: `@devkit-orquestrador` ou `/devkit-orquestrador` deve carregar o agente

---

## Como Invocar Agentes

### Modo 1 — @-mention de rule (por projeto)

```
@devkit-orquestrador criar API REST de pedidos com Node.js e PostgreSQL
@devkit-frontend criar tela de listagem com filtros e paginação
@devkit-banco-dados criar schema de usuários com UUID como PK
```

### Modo 2 — Skills globais (instalação global)

```
/devkit-orquestrador criar sistema de gestão de estoque
/devkit-backend-dotnet adicionar endpoint PATCH /api/pedidos/{id}
/devkit-cerebro qual o estado atual do projeto?
```

### Modo 3 — Custom Modes (equivalente ao seletor do Copilot)

1. **Cursor Settings → Chat → Custom Modes → Add Mode**
2. Nome: `DevKit Orquestrador` (ou outro agente)
3. **Instructions:** cole o conteúdo de `.github/agents/devkit-orquestrador.agent.md`
4. Selecione o mode no dropdown antes de enviar a mensagem

### Modo 4 — Prompt explícito

```
Atue como DevKit Orquestrador.
Leia .github/agents/devkit-orquestrador.agent.md e siga integralmente.
```

---

## Protocolo para o LLM

> **Instruções para o Agent:** leia esta seção em toda sessão DevKit. O arquivo `AGENTS.md` na raiz resume o essencial; este documento é a referência completa.

### Como ler e executar um agente

Quando uma rule é invocada (ex: `@devkit-orquestrador`), um skill é chamado (ex: `/devkit-backend-node`) ou um Custom Mode é selecionado:

1. Leia o `.agent.md` correspondente em `.github/agents/` **integralmente**
2. Verifique se `.DevKit/context.md` existe — crie se necessário (skill `project-context-bank`)
3. Execute o hook **PRE_TASK** lendo `.github/hooks/PRE_TASK.md`
4. Execute a tarefa conforme constraints do agente
5. Execute **POST_IMPLEMENT** → **POST_VALIDATE** conforme hooks
6. Ao encerrar a sessão: **POST_SESSION** + skill `git-workflow`

O arquivo `.agent.md` é a **fonte de verdade** do comportamento. Nunca ignore suas constraints.

### Fluxo interno (exemplo orquestrador)

```text
Usuário: @devkit-orquestrador criar app de pedidos
  │
  ├─► Cursor lê AGENTS.md + rule devkit-orquestrador.mdc
  ├─► Agent lê .github/agents/devkit-orquestrador.agent.md
  ├─► Verifica/cria .DevKit/context.md
  │
  ├─► PRE_TASK (Cérebro) → Context Brief
  ├─► Task tool → sub-agente Arquitetura
  ├─► POST_IMPLEMENT (Tester) → PASS
  ├─► POST_VALIDATE (Cérebro) → atualiza context.md
  │
  ├─► (repete por camada: banco → backend → frontend → docs)
  │
  └─► POST_SESSION → git workflow apresentado ao usuário
```

---

## Sub-agentes (Task Tool)

Quando o orquestrador precisar delegar, use a ferramenta **Task** com `subagent_type: "generalPurpose"`. Monte o prompt assim:

```text
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

> **Equivalente Claude Code:** substitua Task tool por Agent tool com `subagent_type: "general-purpose"`. O prompt do sub-agente é idêntico.

---

## Lifecycle Hooks

Os hooks são executados **por você** (LLM), lendo os arquivos em `.github/hooks/`:

| Hook | Quando executar | Arquivo de referência | Executor típico |
|---|---|---|---|
| PRE_TASK | Antes de cada delegação para sub-agente | `.github/hooks/PRE_TASK.md` | DevKit Cérebro |
| POST_IMPLEMENT | Após o sub-agente concluir a implementação | `.github/hooks/POST_IMPLEMENT.md` | DevKit Tester |
| POST_VALIDATE | Após PASS ou FAIL_FIXABLE resolvido | `.github/hooks/POST_VALIDATE.md` | DevKit Cérebro |
| POST_SESSION | Ao encerrar sessão ("commita", "pronto", etc.) | `.github/hooks/POST_SESSION.md` | Orquestrador |

**Fluxo por camada:**

```text
PRE_TASK → sub-agente → POST_IMPLEMENT → (se PASS) POST_VALIDATE → próxima camada
```

Se POST_IMPLEMENT retornar `FAIL_BLOCKED`: **pare imediatamente**, informe o usuário com o erro exato e aguarde instrução.

Consulte também a skill `lifecycle-hooks` para o protocolo de orquestração completo.

---

## Context Bank

O estado do projeto vive em `.DevKit/context.md`. Se não existir, crie antes da primeira delegação.

### Template inicial

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

Use a skill `project-context-bank` para o template completo e regras de atualização.

---

## Skills

Skills ficam em `.cursor/skills/<nome>/SKILL.md` (por projeto) ou `~/.cursor/skills/` (global).

| Invocação | Exemplo |
|---|---|
| @-mention | `@scaffold-clean-arch`, `@revisao-owasp` |
| Slash command | `/git-workflow`, `/project-context-bank` |

**Sincronizar** de `.github/skills/` para `.cursor/skills/`:

```powershell
./scripts/sync-cursor-skills.ps1
```

O diretório `.cursor/skills/` é gerado localmente e **não deve ser commitado** (está no `.gitignore`).

---

## Mapeamento de Agentes

| Rule / Skill | Arquivo `.agent.md` | Quando usar |
|---|---|---|
| `@devkit-orquestrador` | `devkit-orquestrador.agent.md` | App completa, múltiplas camadas |
| `@devkit-arquitetura` | `devkit-arquitetura.agent.md` | Decisões de stack e estrutura |
| `@devkit-banco-dados` | `devkit-banco-dados.agent.md` | Schema, migrations PostgreSQL |
| `@devkit-backend` | `devkit-backend.agent.md` | Roteador de linguagem backend |
| `@devkit-backend-dotnet` | `devkit-dotnet-backend.agent.md` | ASP.NET Core, EF Core, C# |
| `@devkit-backend-node` | `devkit-nodejs-backend.agent.md` | Fastify/NestJS, TypeScript |
| `@devkit-backend-python` | `devkit-python-backend.agent.md` | FastAPI, Django REST |
| `@devkit-backend-go` | `devkit-go-backend.agent.md` | Gin/Fiber, pgx |
| `@devkit-backend-java` | `devkit-java-backend.agent.md` | Spring Boot, Quarkus |
| `@devkit-backend-rust` | `devkit-rust-backend.agent.md` | Axum, SQLx |
| `@devkit-frontend` | `devkit-frontend.agent.md` | React, Next.js |
| `@devkit-frontend-mvc` | `devkit-aspnetcore-mvc-frontend.agent.md` | ASP.NET Core MVC |
| `@devkit-frontend-blazor` | `devkit-blazor-wasm-frontend.agent.md` | Blazor WASM |
| `@devkit-sre` | `devkit-sre.agent.md` | Docker, K8s, CI/CD |
| `@devkit-sre-investigador` | `devkit-sre-investigador.agent.md` | CrashLoopBackOff, 503, OOMKilled |
| `@devkit-tester` | `devkit-tester.agent.md` | Validação pós-implementação |
| `@devkit-documentacao` | `devkit-documentacao.agent.md` | README, ADR, changelogs |
| `@devkit-cerebro` | `devkit-cerebro.agent.md` | Estado do projeto, conflitos cross-camada |

---

## Scripts de Manutenção

| Script | Função |
|---|---|
| `scripts/sync-cursor-skills.ps1` | Copia `.github/skills/` → `.cursor/skills/` |
| `scripts/generate-cursor-rules.ps1` | Regenera `.cursor/rules/` a partir de `cursor-agent-map.json` |
| `scripts/setup-devkit-project.ps1` | Cria `.DevKit/context.md` e `toolkit.config.md` no projeto |
| `scripts/setup-cursor-global.ps1` | Instala skills globalmente em `~/.cursor/skills/` |
| `scripts/generate-cursor-global-skills.ps1` | Regenera skills de agente na instalação global |

**Adicionar um agente novo:**

1. Crie `.github/agents/<nome>.agent.md`
2. Adicione entrada em `scripts/cursor-agent-map.json`
3. Execute `./scripts/generate-cursor-rules.ps1`
4. Se instalação global: `./scripts/generate-cursor-global-skills.ps1`

---

## Comparação com Outros Ambientes

| Aspecto | Copilot | Claude Code | Antigravity | Cursor |
|---|---|---|---|---|
| Definição dos agentes | `.github/agents/*.agent.md` | os mesmos | os mesmos | os mesmos |
| Ativação | seletor de modo | `/orquestrador` | `/orquestrador` | `@devkit-orquestrador` ou Custom Mode |
| Sub-agentes | runtime nativo | Agent tool | workflows | Task tool |
| Lifecycle hooks | runtime | LLM lê `.github/hooks/` | LLM lê hooks | LLM lê `.github/hooks/` |
| Context Bank | `.DevKit/context.md` | o mesmo | KIs + context.md | o mesmo |
| Skills | por nome | por nome | automáticas | `@skill-name` ou `/skill-name` |
| Doc principal | README | CLAUDE.md | ANTIGRAVITY.md | **CURSOR.md** |

---

## Regras Globais (LLM)

- Sempre inspecione a estrutura atual do projeto antes de planejar — nunca assuma que está vazio.
- Nunca pule o PRE_TASK: o Context Brief é o contrato de contexto entre agentes.
- FAIL_BLOCKED para tudo — não avance sem resolução do usuário.
- Consulte `.github/brand/guide.txt` antes de criar qualquer interface.
- Ao final de qualquer entrega, execute POST_SESSION e apresente o git workflow ao usuário antes de confirmar.
- Responda ao usuário no idioma em que ele escreveu (português por padrão).

---

## Referências

| Arquivo | Função |
|---|---|
| [AGENTS.md](AGENTS.md) | Resumo lido automaticamente pelo Cursor |
| [.cursor/COMO-USAR.md](.cursor/COMO-USAR.md) | Guia rápido para humanos |
| [CLAUDE.md](CLAUDE.md) | Protocolo equivalente para Claude Code |
| [ANTIGRAVITY.md](ANTIGRAVITY.md) | Protocolo equivalente para Antigravity |
| [toolkit.config.md](toolkit.config.md) | Configuração do projeto |
