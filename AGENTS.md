# DevKit — instruções para agentes

Este repositório é o próprio kit: skills, subagents e hooks para desenvolvimento full stack em Claude Code, Cursor e Antigravity. Ele é instalado em outros projetos com `node scripts/install.mjs <pasta>`.

## Fontes de verdade (edite só aqui)

| O quê | Onde | Observação |
|---|---|---|
| Skills | `.agents/skills/<nome>/SKILL.md` | Formato Agent Skills padrão: frontmatter só com `name` e `description`. Cursor e Antigravity leem direto daqui. |
| Subagents | `kit/agents/<nome>.md` | Frontmatter neutro: `name`, `description`, `tier` (`cheap` ou `standard`), `access` (`read`, `exec` ou `write`), `skills`. |
| Modelo por ferramenta | `kit/models.json` | Mapeia `tier` para o modelo de cada ferramenta. |
| Campos só do Claude Code | `kit/claude-skill-overrides.json` | Ex.: `context: fork`, `agent`, `argument-hint`. |
| Hooks | `.agents/hooks/devkit-hook.mjs` | Um script Node para as três ferramentas; a ligação fica em `.claude/settings.json`, `.cursor/hooks.json` e `.agents/hooks.json`. |
| Instruções instaladas nos projetos | `kit/templates/` | `AGENTS.md`, `config.md`, `brand.md`. |

## Arquivos gerados (não edite)

`.claude/skills/`, `.claude/agents/`, `.cursor/agents/`, `.agents/agents/`, `plugins/devkit/` (plugin do Cursor, com manifesto e hooks de `kit/cursor-plugin/`) e `plugins/devkit-claude/` (plugin do Claude Code, de `kit/claude-plugin/`) saem de `node scripts/sync.mjs`. Depois de mudar qualquer fonte, rode o sync e confira com `node scripts/sync.mjs --check` antes de commitar.

## Regras para mudar o kit

- Uma skill precisa justificar o custo: conhecimento específico do DevKit ou um procedimento que o modelo erra sem ela. Referência genérica que o modelo já sabe não entra.
- A `description` é o gatilho: diga o que a skill faz e quando usar ("Use quando: ..."). O nome da pasta é igual ao `name`.
- Corpo de skill enxuto; detalhe extenso vai em arquivo ao lado, referenciado por link relativo.
- Subagent recebe pedido autocontido e devolve resumo curto. Tudo que só lê, roda comando ou escreve documentação usa `tier: cheap`.
- O hook sempre falha aberto (sai com 0 e sem saída) e não depende de pacote npm.
- Idioma: português, com acentuação.
- Ao adicionar ou remover skill ou subagent, atualize o README e o CHANGELOG.
