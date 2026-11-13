---
name: contexto
description: "Mantém o Context Bank do projeto em .devkit/context.md: estado por camada, decisões que não devem ser reabertas, libs adotadas, tentativas que falharam e próximos passos. Use quando: iniciar um projeto com o DevKit, retomar trabalho de outra sessão, registrar uma decisão ou o resultado de uma camada, perguntar o estado do projeto ou auditar a consistência entre camadas."
---

# Context Bank

`.devkit/context.md` é a memória do projeto entre sessões e entre ferramentas (Claude Code, Cursor e Antigravity leem o mesmo arquivo). O hook de início de sessão injeta o conteúdo dele automaticamente; o hook de fim de turno lembra de atualizá-lo quando houve mudança de código.

Mantenha o arquivo curto. Ele é lido a cada sessão: registre conclusões, não narrativa.

## Criar

Se `.devkit/context.md` não existir, crie a partir de [template.md](template.md), trocando o nome do projeto e apagando o que não se aplica.

## Ler (antes de trabalhar)

Priorize, nesta ordem: estado por camada, decisões, tentativas que falharam, libs adotadas, restrições, perguntas em aberto. Ao delegar para um subagent, copie para o pedido só os itens que afetam a tarefa dele (o subagent não vê esta conversa).

## Atualizar (ao concluir uma camada ou encerrar a sessão)

| Seção | O que registrar |
|---|---|
| Estado por Camada | status (⏳ não iniciado, 🔄 em progresso, ✅ concluído, ❌ bloqueado) e data |
| Decisões | a decisão, a data e o motivo em uma linha; inclua o que foi descartado |
| Libs Adotadas | nome e versão principal |
| Restrições e Convenções | regras que todo o código deve seguir (ex.: UUID como PK) |
| O Que Já Foi Tentado | abordagem, erro exato e o que resolveu |
| Perguntas em Aberto | o que depende de decisão do usuário |
| Validações | o que foi validado, com qual comando e o resultado |
| Próximos Passos | no máximo 5 itens, o mais importante primeiro |

Regras:

- Só marque uma camada como ✅ depois de validação com `PASS` (skill `tester`).
- Decisão registrada não se reabre sem pedido explícito do usuário. Se uma nova tarefa conflitar com ela, pare e pergunte.
- Use datas absolutas (2026-11-13), nunca "ontem".
- Quando a seção de validações ou de tentativas passar de umas 20 linhas, resuma as antigas em uma linha.
- Nunca registre segredo, token ou dado pessoal.

## Consultar

Responda perguntas de estado lendo o arquivo: o que está pronto, o que falta, o que não fazer, qual o próximo passo. O próximo passo sai do estado: banco antes de backend, contrato antes de frontend, tudo validado antes de docs e release.

## Auditar

Antes de merge ou release, confira cada camada marcada como ✅ contra o código real:

| Camada | Verificação |
|---|---|
| Banco | as tabelas usadas pelo backend existem nas migrations? |
| Backend | os endpoints do contrato estão implementados e testados? |
| Frontend | todo endpoint consumido existe no backend com o mesmo formato? |
| Infra | a porta do Dockerfile bate com o Service? A imagem base é a decidida? |

Relate o que está consistente, o que conflita (com as camadas envolvidas e a ação recomendada) e o que não pôde ser verificado sem executar. Registre o resultado na seção de validações.
