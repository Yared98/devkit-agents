---
name: lifecycle-hooks
description: "Define o protocolo de hooks do ciclo de vida de agentes DevKit. Garante que pre e pos-acao sejam executadas consistentemente: leitura de contexto, validacao, atualizacao de estado e git workflow. Use quando: qualquer agente inicia ou conclui uma tarefa no projeto."
user-invocable: false
---

# Lifecycle Hooks — DevKit

## O que são os Hooks

Hooks são pontos de ação obrigatórios que ocorrem **antes** e **depois** de cada tarefa de agente. Eles garantem que:
- Nenhum agente começa sem ler o estado atual do projeto
- Nenhuma implementação é commitada sem validação
- O estado do projeto é sempre atualizado após cada ciclo
- Conflitos entre camadas são detectados automaticamente

O **orchestrador** é responsável por executar os hooks invocando o `DevKit-cerebro` e o `DevKit-tester` nos momentos corretos.

---

## Os 4 Hooks

### 🪝 PRE_TASK — Antes de qualquer delegação

**Gatilho**: orquestrador está prestes a invocar qualquer sub-agente.

**Executor**: `DevKit-cerebro` em modo `PRE_TASK`

**Input para o Cérebro**:
```
Modo: PRE_TASK
Agente-alvo: {nome do agente que vai receber a delegação}
Tarefa: {descrição breve do que o agente vai fazer}
```

**Output esperado**: Context Brief estruturado (ver agent DevKit-cerebro)

**O que fazer com o output**: Inclua o Context Brief no prompt de delegação para o sub-agente.

**Falha**: Se `.DevKit/context.md` não existir, crie-o com a skill `project-context-bank` antes de prosseguir.

**Exemplo de uso no fluxo**:
```
[Orquestrador]
1. Invoca Cérebro (PRE_TASK, agente-alvo: DevKit-banco-dados)
2. Recebe Context Brief
3. Invoca DevKit-banco-dados com: {tarefa} + {Context Brief}
```

---

### 🪝 POST_IMPLEMENT — Após agente de implementação concluir

**Gatilho**: qualquer agente de implementação (backend, frontend, banco, sre) retornou arquivos criados/modificados.

**Executor**: `DevKit-tester`

**Input para o Tester**:
```
Stack: {linguagem e framework em uso}
O que foi implementado: {descrição + lista de arquivos}
Context Brief: {o mesmo brief usado no PRE_TASK desta tarefa}
```

**Output esperado**: `PASS` | `FAIL_FIXABLE` | `FAIL_BLOCKED`

**Regras de decisão**:
- `PASS` → prossiga para POST_VALIDATE
- `FAIL_FIXABLE` → corrija o problema (máximo 2 tentativas), depois POST_VALIDATE
- `FAIL_BLOCKED` → **pause**. Informe o usuário antes de continuar. Não avance para a próxima camada.

**Proibido**: pular este hook para "ganhar tempo". Uma camada não validada bloqueia todas as seguintes.

---

### 🪝 POST_VALIDATE — Após validação do Tester

**Gatilho**: tester retornou resultado (PASS ou FAIL_FIXABLE resolvido).

**Executor**: `DevKit-cerebro` em modo `POST_TASK`

**Input para o Cérebro**:
```
Modo: POST_TASK
Agente: {nome do agente que implementou}
Ação: {o que foi feito}
Arquivos: {lista de arquivos criados/modificados}
Resultado do Tester: {PASS | FAIL_FIXABLE}
Pendências: {o que o tester apontou como pendência, se houver}
```

**Output esperado**:
- Context.md atualizado (log + estado por camada + validações)
- Lista de conflitos detectados (se houver)
- Próximo agente recomendado

**Após este hook**: o orquestrador decide se avança para próxima camada ou pausa para o usuário.

---

### 🪝 POST_SESSION — Ao encerrar ciclo de trabalho

**Gatilho**: usuário sinaliza encerramento ("pronto", "pode commitar", "terminar", "fechar sessão") OU todas as camadas planejadas estão com status `✅ Concluído`.

**Executor**: skill `git-workflow` (direto pelo orquestrador)

**Procedimento**:
1. Execute `git-workflow` para gerar branch, commit e merge
2. Invoque Cérebro (POST_TASK) para registrar encerramento da sessão no log
3. Atualize `## Log de Execução` com entrada de fechamento:

```markdown
| {data hora} | DevKit-cerebro | sessão encerrada | — | ✅ git workflow gerado |
```

4. Apresente ao usuário: branch + commit + merge + tag (se milestone) para confirmação

---

## Fluxo Completo — Um Ciclo Típico

```
USER: "implemente o cadastro de usuários"

1. 🪝 PRE_TASK
   └── Cérebro sintetiza estado → Context Brief

2. TASK (banco)
   └── DevKit-banco-dados cria migration users.sql
       usando o Context Brief como guia

3. 🪝 POST_IMPLEMENT
   └── Tester: cargo sqlx migrate run → ✅ PASS

4. 🪝 POST_VALIDATE
   └── Cérebro: atualiza Banco=✅, log entry, recomenda backend

5. 🪝 PRE_TASK (novo ciclo)
   └── Cérebro sintetiza estado atualizado → Context Brief v2

6. TASK (backend)
   └── DevKit-rust-backend cria POST /users, GET /users/:id

7. 🪝 POST_IMPLEMENT
   └── Tester: cargo test → ✅ PASS

8. 🪝 POST_VALIDATE
   └── Cérebro: Backend=✅, log, recomenda frontend
       Detecta: frontend ainda não iniciado → registra em Próximos Passos

9. USER: "pode commitar"
   └── 🪝 POST_SESSION → git-workflow → commit + merge
```

---

## Tabela de Responsabilidades

| Hook | Quem executa | Tool usada | Obrigatório? |
|---|---|---|---|
| PRE_TASK | DevKit-cerebro (PRE_TASK) | read | Sim — toda delegação |
| POST_IMPLEMENT | DevKit-tester | execute | Sim — toda implementação |
| POST_VALIDATE | DevKit-cerebro (POST_TASK) | edit | Sim — após validação |
| POST_SESSION | git-workflow skill | execute | Sim — ao encerrar |

---

## Regras de Ouro

1. **PRE sempre antes de delegar** — o sub-agente não decide o que respeitar, o Context Brief decide
2. **POST_IMPLEMENT é inegociável** — nenhuma camada avança sem PASS do tester
3. **Conflitos param o fluxo** — detectado pelo Cérebro, comunicado ao usuário, nunca ignorado
4. **Log de Execução é o rastro de auditoria** — cada hook gera uma entrada; o log nunca é deletado
5. **POST_SESSION faz o commit** — nunca commite fora do hook de sessão para manter o histórico limpo
