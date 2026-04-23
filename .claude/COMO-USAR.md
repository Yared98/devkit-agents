# Como Usar o Sistema de Agentes com Claude Code

Este documento explica a estrutura híbrida de agentes DevKit para uso com o **Claude Code** (CLI/IDE).

---

## Estrutura de Arquivos

```
CLAUDE.md                          ← lido automaticamente pelo Claude em toda sessão
.claude/commands/
  orquestrador.md                  ← /orquestrador
  cerebro.md                       ← /cerebro
  tester.md                        ← /tester
  arquitetura.md                   ← /arquitetura
  banco-dados.md                   ← /banco-dados
  backend.md                       ← /backend  (roteador de linguagem)
  backend-dotnet.md                ← /backend-dotnet
  backend-rust.md                  ← /backend-rust
  backend-node.md                  ← /backend-node
  backend-python.md                ← /backend-python
  backend-go.md                    ← /backend-go
  backend-java.md                  ← /backend-java
  frontend.md                      ← /frontend  (React/Next.js)
  frontend-mvc.md                  ← /frontend-mvc  (ASP.NET Core MVC)
  frontend-blazor.md               ← /frontend-blazor  (Blazor WASM)
  sre.md                           ← /sre
  sre-investigador.md              ← /sre-investigador
  docs.md                          ← /docs
```

---

## Como Usar

### Modo 1 — Aplicação completa (orquestrador coordena tudo)

Use o orquestrador quando quiser desenvolver múltiplas camadas de uma vez:

```
/orquestrador criar um sistema de gestão de estoque com ASP.NET Core MVC .NET 10 e PostgreSQL
```

O Claude lê o `.agent.md` do orquestrador, executa os PRE_TASKs, spawna sub-agentes especializados na sequência certa (arquitetura → banco → backend → frontend), valida cada camada com POST_IMPLEMENT, atualiza o context bank e apresenta o git workflow ao final.

---

### Modo 2 — Uma camada específica (agente direto)

Invoque o agente especialista diretamente, sem passar pelo orquestrador:

```
/frontend-blazor criar o componente ProductList com HttpClient tipado para GET /api/produtos
```

```
/banco-dados criar migration para a tabela de pedidos com items e status
```

```
/tester validar o backend .NET que acabamos de implementar
```

```
/backend-dotnet adicionar endpoint PATCH /api/produtos/{id} com validação FluentValidation
```

---

### Modo 3 — Consultar o estado do projeto

```
/cerebro qual o estado atual do projeto?
/cerebro há conflitos entre as camadas?
/cerebro qual o próximo passo recomendado?
```

---

## O Que Acontece Internamente

Exemplo com `/orquestrador criar app de gestão de produtos com frontend Blazor`:

```
1. Claude Code lê .claude/commands/orquestrador.md

2. Claude lê .github/agents/DevKit-orquestrador.agent.md
   → entende o fluxo, a ordem das camadas e as regras

3. Verifica .DevKit/context.md
   → se não existir, cria o Context Bank antes de continuar

4. Precisa do frontend Blazor WASM
   → lê .github/agents/DevKit-blazor-wasm-frontend.agent.md
   → lê context.md e gera o Context Brief (PRE_TASK)

5. Spawna um sub-agente general-purpose com:
   → conteúdo completo do .agent.md como instruções
   → Context Brief (o que já foi feito, o que não repetir)
   → tarefa específica + estrutura atual do projeto

6. Sub-agente cria os componentes, roda dotnet build

7. Claude avalia o resultado (POST_IMPLEMENT)
   → PASS: atualiza context.md (POST_VALIDATE) e segue
   → FAIL_BLOCKED: para e informa o usuário

8. Ao final: apresenta resumo e git workflow para confirmação
```

---

## Diferença em Relação ao GitHub Copilot Agent Mode

| Aspecto | Copilot Agent Mode | Claude Code (híbrido) |
|---|---|---|
| Definição dos agentes | `.github/agents/*.agent.md` | os mesmos arquivos |
| Ativação | runtime nativo do Copilot | slash commands em `.claude/commands/` |
| Sub-agentes especializados | invocados pelo runtime | spawned via `Agent` tool com `.agent.md` injetado |
| Lifecycle hooks | executados pelo runtime | executados pelo Claude lendo os arquivos em `.github/hooks/` |
| Context Bank | `.DevKit/context.md` | o mesmo arquivo |
| Resultado final | arquivos no workspace | idêntico |

Os arquivos `.agent.md` e `.github/hooks/` são **compartilhados** entre os dois sistemas. Você mantém uma única fonte de verdade e usa a ferramenta que preferir em cada momento.

---

## Referências Rápidas

| Arquivo | Função |
|---|---|
| `CLAUDE.md` | Protocolo global — lido pelo Claude em toda sessão |
| `.github/agents/` | Definições completas de cada agente |
| `.github/hooks/` | Protocolo detalhado de cada lifecycle hook |
| `.github/brand/guide.txt` | Identidade visual para agentes de frontend |
| `.DevKit/context.md` | Estado vivo do projeto (criado na primeira sessão) |
| `docs/contracts/` | Contratos de API entre frontend e backend |
