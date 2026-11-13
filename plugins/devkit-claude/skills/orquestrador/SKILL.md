---
name: orquestrador
description: "Conduz uma entrega full stack de ponta a ponta: planeja as camadas (arquitetura, banco, backend, frontend, infra, docs), delega a subagents baratos o que não exige o modelo principal e valida cada camada antes de avançar. Use quando: criar uma aplicação completa, implementar uma feature que atravessa mais de uma camada, ou coordenar várias frentes de trabalho no mesmo projeto."
argument-hint: "[o que construir]"
---

# Orquestrador

Você planeja, delega, revisa e integra. O modelo principal é o recurso caro: gaste-o em decisão e integração, não em leitura em massa, execução de testes ou texto repetitivo.

## Quando não orquestrar

- Mudança pequena (até uns 3 arquivos, uma camada só): faça direto, carregando a skill da stack. Delegar custa mais do que resolver.
- Pedido de uma camada só ("cria a migration", "revisa o Dockerfile"): use a skill correspondente, sem o fluxo inteiro.

## Fluxo

1. **Contexto.** O hook de início de sessão já injeta `.devkit/context.md` quando ele existe. Se não existir e o trabalho for durar mais de uma sessão, crie com a skill `contexto`. Nunca reabra decisão registrada.
2. **Escopo.** Pergunte só o que bloqueia (tipo de aplicação, stack obrigatória, requisito crítico). O resto, decida e registre.
3. **Reconhecimento.** Em projeto existente, delegue o mapeamento ao subagent `devkit-explorador` (modelo barato, só leitura) e trabalhe a partir do resumo dele. Nunca assuma que o projeto está vazio.
4. **Plano.** Liste as camadas necessárias, a ordem e o que pode rodar em paralelo. Use a lista de tarefas da ferramenta.
5. **Por camada:** implementar, validar, registrar (detalhe abaixo).
6. **Revisão.** Antes de fechar, delegue ao `devkit-revisor` a revisão do diff completo quando houver autenticação, dados pessoais, pagamentos, SQL montado à mão ou infraestrutura exposta.
7. **Fechamento.** Atualize o Context Bank (skill `contexto`), peça a documentação ao `devkit-documentador` e apresente branch, commits e próximos passos (skill `git-workflow`). Não faça commit, merge nem push sem o usuário pedir.

## Camadas e skills

| Ordem | Camada | Skill que o implementador carrega |
|---|---|---|
| 1 | Arquitetura e stack | `arquitetura` (feita por você, no modelo principal: é decisão) |
| 2 | Contrato de API | `contrato-api` (por você; destrava backend e frontend em paralelo) |
| 3 | Banco de dados | `banco-dados` |
| 4 | Backend | `backend` para escolher a linguagem, depois `backend-node`, `backend-python`, `backend-go`, `backend-java`, `backend-dotnet` ou `backend-rust` |
| 4 | Frontend | `frontend`, `frontend-blazor` ou `frontend-mvc` |
| 5 | Infra | `sre` (e `sre-investigador` para falha em cluster) |
| 6 | Documentação | `docs` |

Backend e frontend podem rodar em paralelo depois que o contrato em `docs/contracts/` existir. Banco vem antes do backend.

## Ciclo de cada camada

1. **Implementar.** Delegue ao subagent `devkit-implementador` com um pedido autocontido: a skill a carregar, a tarefa, os arquivos que pode tocar, o contrato e as decisões do Context Bank que se aplicam, e o comando de verificação. O subagent não vê esta conversa: o que não estiver no pedido, ele não sabe.
2. **Validar.** Delegue ao `devkit-validador` (modelo barato). Ele devolve `PASS`, `FAIL_FIXABLE` ou `FAIL_BLOCKED`.
   - `FAIL_FIXABLE`: devolva o erro ao implementador. Na segunda falha da mesma tarefa, corrija você mesmo em vez de repetir o pedido.
   - `FAIL_BLOCKED`: pare, mostre o erro exato ao usuário e aguarde.
3. **Conferir.** Leia o diff da camada antes de aceitar. Relatório "tudo verde" não é prova: confira se os testes realmente exercitam a regra.
4. **Registrar.** Atualize o estado da camada em `.devkit/context.md`.

## Qual modelo faz o quê

| Trabalho | Quem | Modelo |
|---|---|---|
| Decisão de arquitetura, contrato, integração entre camadas, revisão final | Você | principal |
| Implementação de uma camada | `devkit-implementador` | intermediário |
| Revisão de segurança e de regra de negócio | `devkit-revisor` | intermediário, só leitura |
| Mapear o projeto, buscar onde algo está | `devkit-explorador` | barato, só leitura |
| Rodar build, testes e lint e resumir o resultado | `devkit-validador` | barato |
| README, CHANGELOG, ADR, guias | `devkit-documentador` | barato |

## Como delegar em cada ferramenta

| Ferramenta | Como chamar o subagent |
|---|---|
| Claude Code | ferramenta `Agent` com `subagent_type` igual ao nome (ex.: `devkit-validador`) |
| Cursor | `/devkit-validador <pedido>` ou a ferramenta Task com o nome do subagent |
| Antigravity (App e CLI) | ferramenta `invoke_subagent` ou `@devkit-validador` |

Se a ferramenta não tiver subagents disponíveis (por exemplo, o Antigravity IDE), execute o papel você mesmo carregando a skill indicada, na mesma ordem.

## Resposta final

1. O que foi produzido, por camada: arquivos e decisões (listas curtas).
2. Resultado da validação de cada camada, com o que foi executado.
3. O que ficou pendente ou não foi verificado.
4. Próximos passos e proposta de commits.
