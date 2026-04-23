---
name: traduzir-entrada
description: "Workflow de pré-processamento do orquestrador DevKit. Traduz o input do usuário para inglês usando um modelo leve antes de processar com Claude Sonnet. Use quando: iniciar qualquer tarefa no orquestrador, garantir que sub-agentes recebam contexto em inglês para melhor precisão."
user-invocable: false
---

# Tradução de Entrada

## Propósito

Garantir que toda solicitação ao orquestrador DevKit seja processada em inglês, usando um modelo leve para tradução e Claude Sonnet para o processamento principal. Isso melhora a qualidade das respostas dos sub-agentes e padroniza o contexto enviado entre agentes.

## Quando Usar

Este workflow é executado automaticamente pelo orquestrador a cada nova solicitação do usuário, antes de qualquer delegação para sub-agentes.

## Procedimento

### Passo 1 — Tradução (modelo leve)

Invoque o sub-agente `DevKit-tradutor` passando o texto original do usuário.

- O agente usa `gpt-4o-mini` para realizar a tradução com baixo custo e alta velocidade
- Aguarde o retorno com o texto em inglês
- Se o texto já estiver em inglês, o agente retorna sem alteração

### Passo 2 — Seleção do modelo principal

Após receber o texto traduzido, confirme que o modelo ativo para o processamento principal é:

1. **Claude Sonnet 4.6 (copilot)** — preferencial
2. **Claude Sonnet 4.5 (copilot)** — fallback caso o anterior não esteja disponível

Se nenhum dos dois estiver disponível, informe o usuário antes de prosseguir.

### Passo 3 — Processamento

Use o texto traduzido (inglês) como base para:
- Entender o escopo da solicitação
- Montar o plano com `todo`
- Delegar para os sub-agentes corretos

> O usuário pode continuar escrevendo em qualquer idioma — a tradução é transparente e interna ao workflow.

## Notas

- Nunca exiba o texto traduzido ao usuário — a tradução é interna
- Em caso de ambiguidade na tradução, use a versão mais literal para preservar a intenção técnica
- Termos técnicos (nomes de frameworks, comandos, caminhos de arquivos) não devem ser traduzidos
