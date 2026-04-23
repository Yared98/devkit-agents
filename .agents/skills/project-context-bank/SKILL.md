---
name: project-context-bank
description: "Cria e mantém um banco de contexto persistente do projeto em .DevKit/context.md. Registra decisoes arquiteturais, libs adotadas, o que foi tentado, o que falhou e o que nao fazer. Use quando: iniciar qualquer sessao de desenvolvimento, finalizar uma feature, registrar uma decisao importante, ou antes de tentar algo que pode ja ter sido testado."
user-invocable: true
---

# Project Context Bank

## O Que E Esta Skill

O **Project Context Bank** e um arquivo de conhecimento persistente do projeto que vive em `.DevKit/context.md`. Ele funciona como uma memoria de longo prazo — independente de qualquer conversa — e acumula:

- Decisoes arquiteturais tomadas e o motivo
- Libs adotadas e por que foram escolhidas em vez de alternativas
- O que ja foi tentado e nao funcionou (com o erro)
- Restricoes do projeto (dependencias fixas, versoes proibidas, patterns proibidos)
- Estado atual de cada camada (banco, backend, frontend, infra)
- Proximos passos planejados

---

## Quando Usar

### Leitura (inicio de sessao)

**SEMPRE** que iniciar uma tarefa de desenvolvimento:
1. Leia `.DevKit/context.md` se existir
2. Use o contexto para nao repetir erros anteriores
3. Confirme com o usuario se o estado descrito ainda e valido

### Escrita (fim de sessao ou decisao importante)

Atualize o context bank quando:
- Uma decisao arquitetural foi tomada
- Uma feature foi implementada com sucesso
- Algo foi tentado e falhou — documente o erro e a causa
- Uma lib foi adotada ou rejeitada
- O schema do banco foi alterado
- Um novo endpoint foi criado
- Uma configuracao de infra foi definida

---

## Procedimento

### Passo 1 — Verificar se o Context Bank Existe

```
read: .DevKit/context.md
```

Se nao existir, crie o diretorio e o arquivo com o template inicial (Passo 2).

Se existir, leia o conteudo completo antes de qualquer acao.

### Passo 2 — Criar o Context Bank (primeira vez)

Crie o arquivo `.DevKit/context.md` com o seguinte template:

```markdown
# Project Context Bank

> Arquivo gerado automaticamente pelo DevKit. Nao delete manualmente.
> Ultima atualizacao: {data}

## Visao Geral do Projeto

- **Nome:** {nome-do-projeto}
- **Objetivo:** {descricao-de-uma-linha}
- **Stack principal:** {linguagens e frameworks}
- **Banco de dados:** {banco e ORM}
- **Cloud / infra:** {AWS/Azure/GCP/local}

## Decisoes Arquiteturais

| # | Decisao | Motivo | Data |
|---|---|---|---|
| 1 | {decisao} | {motivo} | {data} |

## Libs Adotadas

| Lib | Versao | Proposito | Alternativas Consideradas |
|---|---|---|---|
| {lib} | {versao} | {para que serve} | {o que foi descartado e por que} |

## O Que Ja Foi Tentado (Nao Repetir)

| Tentativa | Resultado | Causa do Problema | O Que Fazer Em Vez |
|---|---|---|---|
| {descricao} | Falhou | {erro ou motivo} | {solucao correta} |

## Estado Atual das Camadas

### Banco de Dados
- Status: {Em andamento / Concluido / Nao iniciado}
- Migrations aplicadas: {lista ou nenhuma}
- Pendente: {o que falta}

### Backend
- Status: {Em andamento / Concluido / Nao iniciado}
- Endpoints implementados: {lista ou nenhum}
- Pendente: {o que falta}

### Frontend
- Status: {Em andamento / Concluido / Nao iniciado}
- Telas implementadas: {lista ou nenhuma}
- Pendente: {o que falta}

### Infra / SRE
- Status: {Em andamento / Concluido / Nao iniciado}
- Artefatos gerados: {Dockerfile, manifests, pipeline}
- Pendente: {o que falta}

## Restricoes e Convencoes

- {restricao ou convencao importante que todos os agentes devem respeitar}

## Proximos Passos

1. {proximo passo mais prioritario}
2. {segundo passo}

## Estado por Camada (Hooks Status)

| Camada | Status | Agente Responsavel | Ultima Atualizacao |
|---|---|---|---|
| Banco de Dados | ⏳ Nao Iniciado | — | — |
| Backend | ⏳ Nao Iniciado | — | — |
| Frontend | ⏳ Nao Iniciado | — | — |
| Infra / SRE | ⏳ Nao Iniciado | — | — |

> Status: ✅ Concluido | 🔄 Em Progresso | ⏳ Nao Iniciado | ❌ Bloqueado

## Log de Execucao (Hook Events)

| Timestamp | Agente | Acao | Arquivos | Resultado |
|---|---|---|---|---|
| {data hora} | {agente} | {descricao da acao} | {arquivos} | {✅ PASS / ⚠️ FIXABLE / ❌ BLOCKED} |

> Cada hook POST_VALIDATE gera uma entrada aqui. Nunca delete entradas — o log e o rastro de auditoria.

## Perguntas em Aberto

- [ ] {decisao pendente que precisa de resposta do usuario}

> [CONFLITO] {descricao de conflito detectado pelo Cerebro entre camadas}

## Historico de Validacoes (Tester)

| Feature / Arquivo | Status | Pendencias | Data |
|---|---|---|---|
| {feature ou endpoint} | {✅ PASS / ❌ FAIL} | {o que ficou pendente} | {data} |
```

### Passo 3 — Registrar uma Decisao ou Evento

Para adicionar uma nova entrada ao context bank existente, use `edit` para atualizar a secao relevante. Nunca substitua entradas anteriores — apenas acrescente.

#### Formato de registro de falha

```markdown
| Tentar usar {lib X} para {caso de uso} | Falhou | {erro exato ou descricao do problema} | Usar {lib Y} em vez disso |
```

#### Formato de registro de decisao

```markdown
| {numero} | Usar {lib/pattern/framework} para {caso de uso} | {motivo tecnico objetivo} | {data} |
```

### Passo 4 — Exportar Resumo da Sessao

Ao final de cada sessao produtiva, adicione uma entrada na secao **Log de Sessoes**:

```markdown
## Log de Sessoes

### {data} — {titulo da sessao}

**O que foi feito:**
- {item 1}
- {item 2}

**Decisoes tomadas:**
- {decisao}

**Problemas encontrados:**
- {problema e solucao}

**Proximos passos definidos:**
- {passo}
```

---

## Regras do Context Bank

1. **Nao delete entradas antigas** — historico e valioso mesmo quando desatualizado. Marque como `[OBSOLETO]` se necessario.
2. **Seja objetivo** — uma linha por entrada sempre que possivel. O context bank nao e um documento narrativo.
3. **Registre falhas com o erro exato** — ex: `cargo build falhou com 'the trait Sync is not implemented for...'`
4. **Atualize o estado das camadas** a cada feature concluida.
5. **O context bank e lido por todos os agentes** — escreva para quem vai ler sem contexto previo da conversa.
6. **Commite o `.DevKit/` junto com o codigo** — ele e parte do projeto, nao um arquivo temporario.

---

## Integracao com Outros Agentes

O **DevKit-cerebro** e o agente responsavel por ler, sintetizar e atualizar o context bank via lifecycle hooks. Nao atualize o context bank manualmente se o Cerebro estiver ativo no fluxo — deixe o hook POST_VALIDATE fazer isso.

O contexto exportado deve ser passado como prefixo de contexto ao invocar sub-agentes:

```
Antes de iniciar: leia .DevKit/context.md e considere todas as decisoes e restricoes registradas.
```

Agentes que devem ler o context bank antes de agir:

- `DevKit-cerebro` — le, sintetiza e atualiza o context bank via hooks (orquestrador usa este agente para gerenciar o estado)
- `DevKit-arquitetura` — para nao resugerir arquiteturas ja descartadas
- `DevKit-banco-dados` — para respeitar schema ja definido
- todos os agentes de backend — para nao readotar libs ja rejeitadas
- `DevKit-tester` — para entender o estado esperado do sistema antes de testar
- `DevKit-orquestrador` — para nao replanejar do zero o que ja esta feito

---

## Output Esperado

- Arquivo `.DevKit/context.md` criado ou atualizado no workspace
- Resumo do que foi adicionado ao context bank
- Proximos passos refletidos na secao correspondente
