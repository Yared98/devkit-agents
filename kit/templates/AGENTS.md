# Instruções para agentes

Este projeto usa o DevKit: skills, subagents e hooks compartilhados entre Claude Code, Cursor e Antigravity.

## Como trabalhar aqui

- **Contexto do projeto:** `.devkit/context.md` guarda estado por camada, decisões e tentativas que falharam. Um hook o injeta no início da sessão. Não reabra decisão registrada sem pedido do usuário; atualize o arquivo ao concluir uma camada (skill `contexto`).
- **Configuração:** `.devkit/config.md` (stack e convenções) e `.devkit/brand.md` (identidade visual, leia antes de criar interface).
- **Skills:** carregue só a skill da tarefa em mãos. Entrega que atravessa camadas: `orquestrador`. Uma camada só: `arquitetura`, `banco-dados`, `backend` (ou `backend-node`, `backend-python`, `backend-go`, `backend-java`, `backend-dotnet`, `backend-rust`), `frontend` (ou `frontend-blazor`, `frontend-mvc`), `sre`, `sre-investigador`, `tester`, `docs`.
- **Subagents:** delegue o que não exige o modelo principal. `devkit-explorador` (mapear o projeto), `devkit-validador` (build, testes, lint) e `devkit-documentador` rodam em modelo barato; os implementadores por stack (`devkit-backend-go`, `devkit-frontend`, `devkit-banco-dados`, `devkit-sre` e os demais, com o mesmo nome da skill) e o `devkit-revisor` rodam em modelo intermediário. Mudança pequena, faça direto.
- **Contrato de API:** `docs/contracts/` é a referência entre backend e frontend. Defina antes de implementar (skill `contrato-api`).

## Regras

- Inspecione o projeto antes de planejar; nunca assuma que está vazio.
- Nenhuma camada é dada como concluída sem validação executada de verdade (`PASS` da skill `tester`). `FAIL_BLOCKED` para o trabalho até o usuário decidir.
- Sem segredos no código nem no Context Bank.
- Não faça commit, merge, push nem comando destrutivo sem o usuário pedir.
