# DevKit — Instruções para o Agent (Cursor)

Este projeto usa o **DevKit**, sistema multi-agente para desenvolvimento completo.

Leia `CURSOR.md` para o protocolo completo (hooks, sub-agentes, context bank).

## Ativar um agente

| Forma | Exemplo |
|---|---|
| @-mention de rule | `@devkit-orquestrador` |
| Custom Mode | Settings → Chat → Custom Modes |
| Prompt explícito | "Atue como DevKit Orquestrador" |

## Mapeamento rápido

| Pedido | Rule / Arquivo |
|---|---|
| app completa | `@devkit-orquestrador` → `devkit-orquestrador.agent.md` |
| arquitetura | `@devkit-arquitetura` |
| banco de dados | `@devkit-banco-dados` |
| backend (geral) | `@devkit-backend` |
| backend .NET | `@devkit-backend-dotnet` |
| backend Node.js | `@devkit-backend-node` |
| backend Python | `@devkit-backend-python` |
| backend Go | `@devkit-backend-go` |
| backend Java | `@devkit-backend-java` |
| backend Rust | `@devkit-backend-rust` |
| frontend React | `@devkit-frontend` |
| frontend MVC | `@devkit-frontend-mvc` |
| frontend Blazor | `@devkit-frontend-blazor` |
| SRE / K8s | `@devkit-sre` |
| SRE investigador | `@devkit-sre-investigador` |
| testar / validar | `@devkit-tester` |
| documentação | `@devkit-documentacao` |
| estado do projeto | `@devkit-cerebro` |

Sempre leia o `.agent.md` correspondente em `.github/agents/` e execute os hooks em `.github/hooks/`.

Edite `toolkit.config.md` com dados do seu projeto.
