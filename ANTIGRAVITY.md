# DevKit — Workspace Nativo Antigravity

Este documento explica como utilizar o ecossistema DevKit **diretamente no Antigravity** (IDE ou Cloud), tirando máximo proveito das _features_ nativas de agentes da Google Deepmind, com economia extrema de tokens (context window).

Diferente do Copilot (que requer prompts massivos de injeção) e do Claude (que agrupa roteadores textuais), o Antigravity possui **Skills e Workflows integrados** que rodam em segundo plano.

---

## Estrutura de Arquivos Otimizada

```text
.agents/
  workflows/       ← Slash commands e agentes (.md com cabeçalho YAML)
  skills/          ← Micro-comportamentos carregados sob demanda (SKILL.md)
```

O Antigravity lê nativamente a pasta `.agents` ou subpastas homologadas e aplica a inteligência no momento exato em que a sua intenção de código demandar.

---

## Como Usar / Invocar Workflows

No chat principal do Antigravity, você interage com os agentes usando **Slash Commands** (`/`). Isso dirá ao Antigravity para carregar o Workflow instanciado dentro da pasta `.agents/workflows/`.

### Exemplos Iniciais
Você pode delegar uma tarefa inteira num comando simples:

```
/orquestrador Crie um sistema de gestão de estoque com backend em Node.js e banco de dados PostgreSQL
```

```
/backend-dotnet Adicione um endpoint PATCH para atualizar o status do pedido, com validação FluentValidation
```

```
/frontend-blazor Crie um dashboard com gráficos de faturamento que consome a API REST
```

**Como funciona internamente?**
Ao invocar ex: `/backend-dotnet`, o Antigravity varre silenciosamente `.agents/workflows/backend-dotnet.md`, carrega seu Frontmatter `description`, aplica as restrições arquiteturais DevKit e monta o seu **Plano de Implementação** interativo no painel de artefatos.

---

## Skills Automáticas

Você **NÃO** precisa invocar Skills manualmente (diferente dos workflows).
Se o Antigravity identificar no meu prompt e nas heurísticas que estamos prestando atenção em infraestrutura, as Skills instaladas em `.agents/skills/` (ex: `scaffold-k8s`, `ansible`, `pipeline-cicd`) **são ativadas cirurgicamente e injetadas na minha memória curta**. 

Se você pede algo crítico (ex: _"Valide a vulnerabilidade destas bibliotecas"_), eu automaticamente "puxarei" a sua regra `security-lib-scan` ou `revisao-owasp` sem que você diga `/owasp`.

---

## Contexto, Estado e Cérebro (KIs)

Para resolver o famoso problema de contexto global do projeto ("O que já foi feito?" "Qual a stack definida?"), você utilizava o `DevKit Cérebro` para editar arquivos `context.md` locais.
No Antigravity, **a memória do projeto é automatizada via KIs (Knowledge Items)**.

1. **Memória Contínua:** Sempre que finalizamos tarefas grandes através de um _task boundary_ (Plano → Execução → Validação), o Antigravity condensa as conquistas em sua memória transversal (`appDataDir/knowledge`). 
2. **Sem repetição:** Na sua próxima sessão de desenvolvimento, você pode só iniciar dizendo o que precisa. Antes de fazer o código, meu Subagente de Conhecimento rastreará as KIs antigas, lerá os contratos e dirá "A fundação já usa PostgreSQL; continuarei usando ele".
3. **Artefatos:** Toda comunicação estruturada resultará em documentos `.md` perfeitamente diagramados no seu painel de interface de usuário (Planos e Walkthroughs).

---

## Turbos Automáticos (Turbo Automation)

Ao definir pipelines (como o Orquestrador), arquivos de Workflow (`.md`) podem conter a tag `// turbo`. Quando há essa flag, o Antigravity assumirá permissão automática de execução para rodar aquele script específico sem precisar que você clique manualmente em "Aprovar" no terminal.

*Isso poupa etapas de aprovação para scaffolds básicos de arquitetura e scripts previsíveis.*
