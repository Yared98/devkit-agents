# Como Usar o Sistema de Agentes com Cursor

Este documento explica a estrutura híbrida de agentes DevKit para uso com o **Cursor IDE**.

---

## Estrutura de Arquivos

```
AGENTS.md                          ← lido automaticamente pelo Cursor em toda sessão
CURSOR.md                          ← protocolo global (hooks, sub-agentes, context bank)
.cursor/
  rules/                           ← rules @-mentionáveis por agente (*.mdc)
  skills/                          ← skills sincronizadas de .github/skills/
  COMO-USAR.md                     ← este arquivo
.github/
  agents/                          ← fonte de verdade de cada agente (.agent.md)
  hooks/                           ← lifecycle hooks
.DevKit/
  context.md                       ← Context Bank (criado na primeira sessão)
```

---

## Setup Inicial

Se você clonou este repositório como template ou copiou os arquivos para um projeto existente:

```powershell
# Sincronizar skills para o formato Cursor
./scripts/sync-cursor-skills.ps1

# Regenerar rules (após editar scripts/cursor-agent-map.json)
./scripts/generate-cursor-rules.ps1
```

Edite `toolkit.config.md` com nome, stack e identidade visual do seu projeto.

---

## Como Usar

### Modo 1 — Aplicação completa (orquestrador coordena tudo)

No chat do Cursor, mencione a rule do orquestrador:

```
@devkit-orquestrador criar um sistema de gestão de estoque com ASP.NET Core MVC e PostgreSQL
```

O Agent lê o `.agent.md` do orquestrador, executa PRE_TASKs, spawna sub-agentes via Task tool na sequência correta, valida cada camada e apresenta o git workflow ao final.

---

### Modo 2 — Uma camada específica (agente direto)

```
@devkit-frontend-blazor criar o componente ProductList com HttpClient tipado
```

```
@devkit-banco-dados criar migration para pedidos com items e status
```

```
@devkit-tester validar o backend .NET que acabamos de implementar
```

```
@devkit-backend-dotnet adicionar endpoint PATCH /api/produtos/{id}
```

---

### Modo 3 — Custom Modes (equivalente ao seletor do Copilot)

1. Abra **Cursor Settings → Chat → Custom Modes**
2. Crie um mode para cada agente que você usa com frequência
3. Cole o conteúdo do `.agent.md` correspondente em **Instructions**
4. Selecione o mode no dropdown antes de enviar a mensagem

Recomendado para: Orquestrador, Frontend, Backend da sua stack principal.

---

### Modo 4 — Consultar estado do projeto

```
@devkit-cerebro qual o estado atual do projeto?
@devkit-cerebro há conflitos entre as camadas?
@devkit-cerebro qual o próximo passo recomendado?
```

---

## O Que Acontece Internamente

Exemplo com `@devkit-orquestrador criar app com frontend Blazor`:

```
1. Cursor lê AGENTS.md e a rule devkit-orquestrador.mdc
2. Agent lê .github/agents/devkit-orquestrador.agent.md
3. Verifica .DevKit/context.md (cria se não existir)
4. PRE_TASK → Context Brief
5. Task tool spawna sub-agente com .agent.md + Context Brief + tarefa
6. POST_IMPLEMENT → PASS | FAIL_FIXABLE | FAIL_BLOCKED
7. POST_VALIDATE → atualiza context.md
8. POST_SESSION → git workflow
```

---

## Diferença em Relação aos Outros Ambientes

| Aspecto | Copilot | Claude Code | Cursor |
|---|---|---|---|
| Definição dos agentes | `.github/agents/*.agent.md` | os mesmos | os mesmos |
| Ativação | seletor de modo | `/orquestrador` | `@devkit-orquestrador` ou Custom Mode |
| Sub-agentes | runtime nativo | Agent tool | Task tool |
| Lifecycle hooks | runtime | Claude lê `.github/hooks/` | Agent lê `.github/hooks/` |
| Context Bank | `.DevKit/context.md` | o mesmo | o mesmo |
| Skills | por nome | por nome | `@skill-name` em `.cursor/skills/` |

Os arquivos `.agent.md` e `.github/hooks/` são **compartilhados** entre todos os ambientes.

---

## Referências Rápidas

| Arquivo | Função |
|---|---|
| `AGENTS.md` | Instruções globais — lidas automaticamente |
| `CURSOR.md` | Protocolo completo de hooks e sub-agentes |
| `.cursor/rules/` | Rules @-mentionáveis por agente |
| `.github/agents/` | Definições completas de cada agente |
| `.github/hooks/` | Protocolo de cada lifecycle hook |
| `scripts/cursor-agent-map.json` | Mapa para regenerar rules |
| `scripts/sync-cursor-skills.ps1` | Sincroniza skills para `.cursor/skills/` |
