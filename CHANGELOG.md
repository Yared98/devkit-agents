# Changelog — DevKit Agentes Development

Todas as mudanças significativas do repositório são documentadas aqui.  
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) com [Conventional Commits](https://www.conventionalcommits.org/).

---

## [v2.0.0] — 2026-11-13

Reestruturação para skills, subagents e hooks nativos de Claude Code, Cursor e Antigravity, com fonte única.

### Adicionado

- **Fonte única de skills** em `.agents/skills/` (formato Agent Skills padrão), copiada para `.claude/skills/` por `scripts/sync.mjs`.
- **Subagents reais** em `kit/agents/`, gerados para `.claude/agents/`, `.cursor/agents/` e `.agents/agents/`: `devkit-explorador`, `devkit-validador` e `devkit-documentador` em modelo barato; `devkit-implementador` e `devkit-revisor` em modelo intermediário. Modelos por ferramenta em `kit/models.json`.
- **Hooks reais** (`.agents/hooks/devkit-hook.mjs`): injeção do Context Bank no início da sessão, confirmação para comandos destrutivos, registro de arquivos alterados e lembrete de validação e registro ao fim do turno.
- **Skills novas:** `contexto` (substitui o agente Cérebro e as skills `project-context-bank` e `lifecycle-hooks`) e `identidade-visual` (une as quatro skills de marca).
- **Plugin do Cursor**: `.cursor-plugin/marketplace.json` na raiz e o plugin `devkit` gerado em `plugins/devkit/` (skills, subagents e hooks), para instalar pelo Customize do Cursor sem copiar arquivos.
- **Subagents por stack**: 11 implementadores (`devkit-backend-*`, `devkit-frontend*`, `devkit-banco-dados`, `devkit-sre`), cada um com a skill da stack pré-carregada, gerados de `kit/stack-agent.md` e `kit/stack-agents.json`. O `orquestrador` passa a delegar para eles.
- **Plugin do Claude Code**: `.claude-plugin/marketplace.json` na raiz e o plugin `devkit` gerado em `plugins/devkit-claude/`, instalável com `claude plugin install devkit@devkit-agents`.
- **Hooks sem disparo duplo**: quando o plugin e a instalação por projeto coexistem, o script do plugin se cala e vale o do projeto.
- **Hook `subagentStop` no Cursor**: registra os arquivos alterados por subagents.
- **`scripts/install.mjs`**: instala o kit em outro projeto, por ferramenta, sem sobrescrever arquivos existentes.

### Alterado

- Os 17 agentes de `.github/agents/` viraram skills com o mesmo conteúdo técnico: `orquestrador`, `arquitetura`, `banco-dados`, `backend`, `backend-*`, `frontend*`, `sre`, `sre-investigador`, `tester`, `docs`.
- `decisao-linguagem` passou a ser referência interna da skill `backend`.
- Context Bank em `.devkit/context.md` (minúsculas); configuração em `.devkit/config.md` e marca em `.devkit/brand.md`.
- `AGENTS.md` é o arquivo de instruções canônico; `CLAUDE.md` apenas o importa.

### Removido

- **Camadas duplicadas:** `.github/agents/`, `.github/skills/`, `.github/hooks/`, `.agents/workflows/` (workflows estão obsoletos no Antigravity), `.claude/commands/`, `.cursor/rules/` e os scripts PowerShell de sincronização.
- **Agente e skill de tradução** (`tradutor`, `traduzir-entrada`): os modelos atuais trabalham direto em português; a etapa só gastava tokens.
- **Skills genéricas de comunidade** que repetem o comportamento padrão do modelo ou outra skill do kit: `brainstorming`, `ask-questions-if-underspecified`, `architect-review`, `code-review-checklist`, `security-auditor`, `docker-expert`, `deployment-pipeline-design`, `lint-and-validate`.
- **Guias de linha de comando:** `awscli`, `azurecli`, `gcpsdk`, `ssh-connect`.
- `k8s-troubleshoot` (coberta por `sre-investigador`).
- Documentos por ferramenta (`CURSOR.md`, `CURSOR-GLOBAL.md`, `ANTIGRAVITY.md`, `SKILLS_INTEGRATION.md`, `COMO-USAR.md`), consolidados no README.

---

## [v1.9.1] — 2026-07-31

### Adicionado

- **`CURSOR.md` expandido**: documento canônico para Cursor no padrão de `CLAUDE.md` e `ANTIGRAVITY.md`, com protocolo para LLM, instalação por projeto/global, mapeamento de agentes, hooks, skills e scripts de manutenção.

### Alterado

- **`.cursor/COMO-USAR.md`**: reduzido a guia rápido humano, referenciando `CURSOR.md` para detalhes.
- **`CURSOR-GLOBAL.md`**: consolidado em `CURSOR.md` (redirect).
- **`README.md`**: referências atualizadas para `CURSOR.md` como documentação principal Cursor.

---

## [v1.9.0] — 2026-07-31

### Adicionado

- **Suporte ao Cursor IDE**: adaptação completa do DevKit para o Cursor, mantendo `.github/agents/` e `.github/hooks/` como fonte de verdade compartilhada.
- **`CURSOR.md`**: protocolo global (Task tool, lifecycle hooks, context bank) — equivalente ao `CLAUDE.md`.
- **`AGENTS.md`**: instruções lidas automaticamente pelo Cursor em toda sessão.
- **`.cursor/rules/*.mdc`**: 18 rules @-mentionáveis (`@devkit-orquestrador`, `@devkit-backend-node`, etc.).
- **`.cursor/skills/`**: skills sincronizadas de `.github/skills/` para invocação via `@skill-name`.
- **`.cursor/COMO-USAR.md`**: guia de uso no Cursor (4 modos de invocação).
- **`scripts/cursor-agent-map.json`**: mapa versionado de agentes para regenerar rules.
- **`scripts/generate-cursor-rules.ps1`**: gera `.cursor/rules/` a partir do mapa.
- **`scripts/sync-cursor-skills.ps1`**: sincroniza skills de `.github/skills/` para `.cursor/skills/`.
- **README**: tabela de compatibilidade atualizada com Cursor e seção "Como Ativar" expandida.

---

## [v1.8.4] — 2026-04-20

### Corrigido

- **README — Fluxo interno do Orquestrador**: diagrama ASCII atualizado para refletir todos os agentes ativos. `DevKit Cérebro` (com os 3 hooks que executa), `DevKit Tester` (com nota POST_IMPLEMENT) e `DevKit SRE Investigador` (como sub-agente do SRE) estavam ausentes do diagrama desde antes da v1.8.0.

---

## [v1.8.3] — 2026-04-20

### Adicionado

- **README — Seção "Hooks de Ciclo de Vida"**: documentação dos 4 arquivos em `.github/hooks/` com tabela descritiva (arquivo, executor, quando é acionado), explicação do princípio "hook files como fonte da verdade" e referência cruzada para a skill `lifecycle-hooks`.

---

## [v1.8.2] — 2026-04-20

### Corrigido

- **`DevKit-cerebro` — Modos PRE_TASK e POST_TASK**: instruções inline foram removidas dos modos PRE_TASK e POST_TASK do agente Cérebro. Os dois modos agora referenciam `.github/hooks/PRE_TASK.md` e `.github/hooks/POST_VALIDATE.md` como única fonte da verdade, eliminando o risco de divergência entre o comportamento descrito no agente e o comportamento descrito no hook file.

- **`DevKit-tester` — Hook POST_IMPLEMENT**: adicionada seção que distingue dois contextos de uso do Tester: (1) quando invocado como hook pelo Orquestrador → usa o formato compacto definido em `POST_IMPLEMENT.md`; (2) quando invocado diretamente pelo usuário → usa o formato tabular rico da seção "Output Esperado". Corrige incompatibilidade de formato entre o output do Tester e o que o Cérebro esperava receber no ciclo de hooks.

> **Princípio estabelecido nesta release:** os arquivos em `.github/hooks/` são a fonte da verdade para o comportamento concreto de cada hook. Os agentes referenciam, não replicam.

---

## [v1.8.1] — 2026-04-20

### Adicionado

- **`.github/hooks/PRE_TASK.md`**: instrução completa do hook executado pelo `DevKit-cerebro` antes de qualquer delegação. Define o que ler no `context.md`, o formato exato do Context Brief (7 seções com `###` headings), e como agir quando o context bank não existir ainda.

- **`.github/hooks/POST_IMPLEMENT.md`**: instrução completa do hook executado pelo `DevKit-tester` após cada implementação. Contém tabela de comandos de validação por stack (Rust, Node.js, Python, Go, Java Spring/Quarkus, .NET, PostgreSQL, Docker, K8s, React/Next.js) e os 3 outputs possíveis: `PASS`, `FAIL_FIXABLE`, `FAIL_BLOCKED`.

- **`.github/hooks/POST_VALIDATE.md`**: instrução completa do hook executado pelo `DevKit-cerebro` no modo POST_TASK. Define as 4 seções a atualizar em `context.md` (Estado por Camada, Log de Execução, Histórico de Validações, Próximos Passos), tabela de detecção de 5 tipos de conflito e formato exato do output com 2 exemplos.

- **`.github/hooks/POST_SESSION.md`**: instrução completa do hook de encerramento de sessão, executado pelo Orquestrador. Define gatilhos de linguagem natural, os 4 passos (query ao Cérebro → git-workflow → POST_TASK no log → resumo antes de executar) e a regra de nunca commitar sem confirmação do usuário.

### Alterado

- **`DevKit-cerebro`**: seção "Arquivos de Hook" adicionada com referências aos 4 arquivos criados.
- **`DevKit-orquestrador`**: tabela "Fluxo de Trabalho com Lifecycle Hooks" substituiu o texto descritivo anterior, mapeando cada hook ao seu executor e ao arquivo de referência.

---

## [v1.8.0] — 2026-04-20

### Adicionado

- **Agente `DevKit-cerebro`**: novo agente de estado central com 4 modos de operação: `PRE_TASK` (síntese de contexto antes de delegar), `POST_TASK` (atualização de estado após validação), `QUERY` (consulta pontual ao estado atual) e `AUDIT` (auditoria cross-camada para detectar conflitos). Responsável por manter o arquivo `.DevKit/context.md` como fonte de verdade do projeto.

- **Skill `lifecycle-hooks`**: protocolo dos 4 hooks do ciclo de vida (`PRE_TASK`, `POST_IMPLEMENT`, `POST_VALIDATE`, `POST_SESSION`), com definição de quando cada hook é acionado, quem o executa e o que produz. Marcada como `user-invocable: false` — invocada pelo Orquestrador, não pelo usuário diretamente.

- **Skill `project-context-bank`** (enriquecida): template de `context.md` ampliado com seção de status por camada (estado + última validação + próximos passos), log de execução de hooks e histórico de validações com timestamp.

### Alterado

- **`DevKit-orquestrador`**: integração completa do ciclo de lifecycle hooks — `DevKit-cerebro` adicionado à lista de `agents:`, referência à skill `lifecycle-hooks` e descrição do fluxo PRE_TASK → delegação → POST_IMPLEMENT → POST_VALIDATE.

- **`.github/copilot-instructions.md`**: checklist de novo agente atualizado para incluir verificação de ciclo de hooks (aplicável a agentes de implementação: backend, frontend, banco, SRE).

---

## [v1.7.0] — 2026-04-20

### Adicionado

- **Agente `DevKit-rust-backend`** (reescrito): agente Rust reescrito como o mais rico da família DevKit. Cobre Axum, Actix-web, async/await, ownership, lifetimes, traits, Clean Architecture, SQLx com PostgreSQL, servidores MCP em Rust e zero-cost abstractions. Posicionado como referência de performance e segurança de memória sem GC.

- **Skill `decisao-linguagem`**: critérios objetivos para seleção de linguagem backend (performance, equipe, prazo, domínio, requisitos operacionais). Matriz de decisão com pontuação por eixo, guia de quando escolher Rust vs. Go vs. Java vs. Node.js vs. Python vs. .NET.

### Alterado

- **`DevKit-orquestrador`**: lógica de roteamento de linguagem adicionada — o Orquestrador agora identifica a stack mencionada pelo usuário e delega ao agente backend especializado correspondente antes de avançar para implementação.

---

## [v1.6.0] — 2026-04-20

### Alterado

- **Agente `DevKit-arquitetura`** (reescrito): cobertura expandida para todos os padrões relevantes do mercado — Clean Architecture, DDD, Hexagonal, Microsserviços, CQRS, Event Sourcing, Saga, BFF, Serverless e Modular Monolith. Inclui matriz de decisão por contexto (equipe, escala, prazo, domínio) e guia de quando não usar cada padrão.

- **Agente `DevKit-dotnet-backend`**: atualizado para .NET 10 LTS como padrão de recomendação (antes .NET 8). Adicionado suporte a C# 13 e pré-visualização de C# 14, com referência às features de cada versão relevantes para APIs REST e microserviços.

---

## [v1.5.0] — 2026-04-20

### Desempenho

- **Agentes `DevKit-rust-backend` e `DevKit-java-backend`**: exemplos de código inline removidos. Redução significativa no tamanho do prompt sem perda de qualidade de output — agentes de implementação devem gerar código adaptado ao contexto, não replicar exemplos fixos.

- **Família de agentes backend** (Node.js, Python, Go, Java, .NET, Rust): seção `Constraints` e `Protocolo de Resposta` adicionados uniformemente. Define o que cada agente NÃO faz (ex: não decide stack, não cria migrations, não gera Dockerfile) e o formato esperado de resposta (estrutura, tom, nível de detalhe).

- **Agentes `DevKit-sre`, `DevKit-sre-investigador` e `DevKit-orquestrador`**: otimização de tokens — instruções redundantes consolidadas, seções de exemplo encurtadas, referências a skills substituindo prosa explicativa longa.

---

## [v1.4.0] — 2026-04-16

_Baseline desta série de changelogs. Ver histórico anterior no repositório._

---

[v1.8.4]: https://github.com/yared98/devkit-agents/compare/v1.8.3...v1.8.4
[v1.8.3]: https://github.com/yared98/devkit-agents/compare/v1.8.2...v1.8.3
[v1.8.2]: https://github.com/yared98/devkit-agents/compare/v1.8.1...v1.8.2
[v1.8.1]: https://github.com/yared98/devkit-agents/compare/v1.8.0...v1.8.1
[v1.8.0]: https://github.com/yared98/devkit-agents/compare/v1.7.0...v1.8.0
[v1.7.0]: https://github.com/yared98/devkit-agents/compare/v1.6.0...v1.7.0
[v1.6.0]: https://github.com/yared98/devkit-agents/compare/v1.5.0...v1.6.0
[v1.5.0]: https://github.com/yared98/devkit-agents/compare/v1.4.0...v1.5.0
[v1.4.0]: https://github.com/yared98/devkit-agents/releases/tag/v1.4.0
