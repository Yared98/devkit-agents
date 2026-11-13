---
name: git-workflow
description: "Define e executa o padrão de trabalho com Git no repositório DevKit: branches, Conventional Commits, merge strategy e tags semver. Use quando: finalizar uma feature, criar commits, realizar merge ou tagear uma release."
---

# Git Workflow DevKit

## Por que padronizar?

Um histórico de commits bem estruturado é a documentação viva do produto. Permite:
- Entender **o que** foi entregue e **por que** em qualquer ponto do tempo
- Gerar **changelogs automáticos** por escopo e tipo
- Navegar o histórico com `git log --oneline` sem precisar abrir arquivos
- Identificar regressões com `git bisect` em segundos
- Relacionar cada mudança a um domínio do sistema (backend, sre, frontend, etc.)

---

## Convenção de Tipos de Commit

Baseada em [Conventional Commits](https://www.conventionalcommits.org/), adaptada ao ecossistema DevKit.

| Tipo | Quando usar | Bumps versão? |
|---|---|---|
| `feat` | Nova funcionalidade, novo agente, nova skill | MINOR (`1.1.0`) |
| `fix` | Correção de bug ou comportamento incorreto | PATCH (`1.0.1`) |
| `docs` | Apenas documentação (README, ADR, guias) | — |
| `refactor` | Reestruturação sem mudança de comportamento | — |
| `chore` | Manutenção, atualização de deps, configs | — |
| `perf` | Melhoria de performance | PATCH |
| `test` | Adição ou correção de testes | — |
| `ci` | Pipelines, GitHub Actions, scripts de build | — |
| `merge` | **Commit de merge** — gerado automaticamente | — |

> ⚠️ `BREAKING CHANGE:` no corpo ou `!` após o tipo (`feat!:`) indica mudança que quebra compatibilidade → bump MAJOR (`2.0.0`).

---

## Escopos Mapeados ao Projeto

O escopo identifica **qual domínio** da stack foi afetado:

| Escopo | O que cobre |
|---|---|
| `agent` | Criação ou alteração de um agente (`kit/agents/`) |
| `skill` | Criação ou alteração de uma skill (`.agents/skills/`) |
| `sre` | Infraestrutura, Kubernetes, Docker, pipelines |
| `backend` | Lógica de negócio, API, camada de serviço |
| `frontend` | Interface, componentes React/Next.js |
| `db` | Migrations, schemas, queries, índices |
| `arch` | Decisões de arquitetura (ADR), estrutura de pastas |
| `brand` | Assets de marca, identidade visual |
| `docs` | Documentação técnica geral (README, wikis) |
| `security` | Correções de vulnerabilidade, OWASP |
| `config` | Arquivos de configuração (`.env`, `tsconfig`, `pom.xml`) |

> Quando a mudança afeta múltiplos escopos, use o escopo mais relevante. Se não houver escopo claro, omita os parênteses.

---

## Formato da Mensagem de Commit

```
<tipo>(<escopo>): <descrição curta em minúsculas, imperativa, sem ponto final>

[corpo opcional — o quê e por quê, não o como]
[lista de mudanças se relevante]

[BREAKING CHANGE: descrição se aplicável]
[Closes #issue se aplicável]
```

### Regras da linha de assunto (header)

- **Máximo 72 caracteres**
- **Imperativa e minúscula:** `adicionar`, `corrigir`, `remover`, `atualizar` — não `adicionado`, `Adiciona`
- **Sem ponto final**
- **Em português** (padrão do projeto)

### Quando incluir corpo

Inclua o corpo quando:
- A mudança não é óbvia pela linha de assunto
- Há contexto de decisão importante a registrar
- A mudança quebra compatibilidade (BREAKING CHANGE)
- Há múltiplos arquivos alterados com propósitos distintos

---

## Exemplos de Mensagens Corretas

```bash
# Nova feature simples
feat(agent): adicionar agente DevKit SRE Investigador

# Nova feature com corpo
feat(skill): adicionar skill git-workflow

Define o padrão de commits, branches e merge do repositório DevKit.
Formaliza o workflow já praticado e o torna invocável por qualquer agente
durante o ciclo de entrega.

# Correção
fix(sre): corrigir selector do Service no template de manifest AKS

# Só documentação
docs: atualizar README com seção do agente SRE Investigador

# Refactor sem mudança de comportamento
refactor(skill): reorganizar seções da skill sre-investigador

# Breaking change
feat(agent)!: remover campo argument-hint do orquestrador

BREAKING CHANGE: agentes que dependiam de argument-hint do orquestrador
precisam definir o campo individualmente.

# Merge commit (gerado pelo workflow, não escrito manualmente)
merge(sre): integrar agente DevKit SRE Investigador
```

---

## Convenção de Branches

### Nomenclatura

```
<tipo>/<escopo-ou-descricao-curta>
```

| Exemplos válidos | Descrição |
|---|---|
| `feat/sre-investigador` | Nova feature no domínio SRE |
| `feat/agente-java-backend` | Novo agente Java |
| `fix/selector-service-aks` | Correção de bug no manifest AKS |
| `docs/readme-skills` | Atualização de documentação |
| `refactor/scaffold-rust-api` | Refatoração da skill Rust |
| `chore/atualizar-dependencias` | Manutenção sem impacto funcional |

### Regras

- **Sempre em minúsculas** com hífens — nunca underscore ou camelCase
- **Curta e descritiva** — máximo 4 palavras após o `/`
- **Uma branch por feature/fix** — nunca acumule mudanças não relacionadas
- **Nunca commite diretamente na `main`** — sempre via branch + merge

---

## Fluxo Completo de Entrega

### 1. Criar a branch

```bash
git checkout main
git pull origin main
git checkout -b feat/<escopo-descricao>
```

### 2. Trabalhar em commits atômicos

Cada commit deve representar **uma unidade lógica completa**:

```bash
# ✅ Commit atômico — uma mudança, um propósito
git add .agents/skills/sre-investigador/
git commit -m "feat(agent): adicionar agente DevKit SRE Investigador"

git add .agents/skills/orquestrador/
git commit -m "feat(agent): registrar SRE Investigador no orquestrador"

git add README.md
git commit -m "docs: adicionar seção do agente SRE Investigador no README"

# ❌ Commit não-atômico — mistura propósitos
git add .
git commit -m "várias coisas"
```

> **Exceção:** quando os arquivos fazem parte de uma única unidade indivisível de entrega (ex: criar um agente + ajustar o orquestrador + atualizar o README são três arquivos mas **um único propósito**), um único commit com corpo descritivo é acceptable.

### 3. Merge na main com `--no-ff`

```bash
git checkout main
git merge --no-ff feat/<escopo-descricao> -m "merge(<escopo>): <descrição do que foi integrado>

<resumo opcional do que a branch entregou>"
```

> `--no-ff` (no fast-forward) **sempre** — preserva o ponto de merge no grafo do Git, tornando visível onde cada feature foi integrada.

### 4. Tagear releases (quando aplicável)

Use tags semver **anotadas** apenas em marcos relevantes (não em toda feature):

```bash
# Criar tag anotada
git tag -a v1.1.0 -m "release: v1.1.0

Novas features:
- Agente SRE Investigador (diagnóstico K8s)
- Skill git-workflow (padrão de commits)"

# Listar tags
git tag -l

# Ver detalhes de uma tag
git show v1.1.0
```

#### Quando tagear

| Situação | Ação |
|---|---|
| Adição de novo agente ou skill relevante | `feat` → MINOR bump |
| Correção que impacta comportamento em uso | `fix` → PATCH bump |
| Breaking change em interface de agente | MAJOR bump |
| Só docs ou refactor | Não tagear |

---

## Checklist Antes do Merge

Execute este checklist antes de cada merge na `main`:

- [ ] Todos os arquivos novos estão **commitados** (nenhum `untracked`)
- [ ] Nenhum arquivo de trabalho temporário incluído (`.env`, `*.log`, builds)
- [ ] A mensagem do commit segue o formato `tipo(escopo): descrição`
- [ ] O corpo do commit explica o **porquê** quando a mudança não é óbvia
- [ ] O README foi atualizado se um novo agente ou skill foi adicionado
- [ ] O orquestrador foi atualizado se um novo agente foi criado
- [ ] A branch segue a nomenclatura `tipo/descricao`
- [ ] O merge usa `--no-ff`

---

## Checklist de Release (Tagging)

- [ ] `git log --oneline` revisado — histórico limpo e legível
- [ ] Tag anotada com `git tag -a vX.Y.Z -m "release: ..."`
- [ ] Corpo da tag lista as features/fixes incluídos desde a tag anterior
- [ ] `git tag -l` confirma que a tag foi criada

---

## Anti-Padrões a Evitar

| Anti-padrão | Problema | Solução |
|---|---|---|
| `fix: ajustes` | Não diz nada | `fix(agent): corrigir description do agente SRE` |
| `commit final` | Ilegível no log | Usar tipo + escopo + descrição imperativa |
| Commit direto na `main` | Perde rastreabilidade | Sempre via branch |
| Fast-forward merge | Oculta quando a feature foi integrada | Sempre `--no-ff` |
| Tag `latest` ou `new` | Sem semver, impossível de rastrear | `v1.2.0` |
| Branch `minha-branch` | Sem contexto | `feat/agente-investigador` |
| Um commit com 20 arquivos de propósitos diferentes | Dificulta bisect e rollback | Commits atômicos por propósito |
| Commitar `.env` ou secrets | Risco de segurança | Usar `.gitignore` |

---

## Output Esperado desta Skill

Ao ser invocada por um agente, esta skill deve produzir:

1. **Mensagem de commit** pronta para uso, seguindo o formato exato
2. **Nome da branch** para a feature em andamento (se ainda não criada)
3. **Comando de merge** completo com `--no-ff` e mensagem
4. **Indicação de tag** se o milestone justificar bump de versão semver
5. **Checklist preenchido** confirmando que todos os critérios foram atendidos
