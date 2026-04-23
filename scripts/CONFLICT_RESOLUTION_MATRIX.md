# Conflict Resolution Matrix

**Data:** 23 de abril de 2026  
**Status:** ✅ Mapeamento completo de conflitos e resoluções  
**Escopo:** DevKit + Antigravity Skill Composition

---

## Visão Geral

Este documento define a **precedência e critérios de resolução** quando o **DevKit** encontra **skills funcionalmente equivalentes** entre:
- **Nativas:** Skills do DevKit (`.github/skills/` e `.agents/skills/*nativas*`)
- **Externas:** Skills importadas do `antigravity-awesome-skills` (`.agents/skills/*externas*`)

---

## Conflitos Identificados

### 1️⃣ Revisão de Segurança OWASP

| Dimensão | Details |
|---|---|
| **Skill Nativa** | `revisao-owasp` (`.github/skills/revisao-owasp/SKILL.md`) |
| **Skill Externa** | `security-auditor` (`.agents/skills/security-auditor/SKILL.md`) |
| **Tipo de Conflito** | Funcionalidade parcialmente sobreposta |
| **Domínio** | Backend, API Security, Threat Modeling |

#### Escopo Funcional

**`revisao-owasp` (NATIVA):**
- ✅ Foco: **OWASP Top 10 específico**
- ✅ Linguagem: Portuguese (pt-BR)
- ✅ Contexto: Code review de endpoints backend
- ✅ Output: Findings por OWASP category
- ✅ Força: Especializada em vulnerabilidades backend em Node.js/Rust/Python/Java

**`security-auditor` (EXTERNA):**
- ✅ Foco: **DevSecOps e conformidade enterprise**
- ✅ Linguagem: English
- ✅ Contexto: Architectura systems, CI/CD, compliance frameworks
- ✅ Output: Risk assessment matrix, remediation roadmap
- ✅ Força: Visão holística de segurança (não apenas OWASP)

#### Critério de Precedência

```
REGRA: USE NA SEQUÊNCIA DESTA PRIORIDADE

1️⃣  NATIVA `revisao-owasp` → QUANDO:
    - Revisar código de endpoint (input validation, SQL injection, XSS, etc.)
    - Agente: DevKit-backend validando implementação
    - Output esperado: Lista de vulnerabilidades OWASP por linha de código
    ✅ Recomendado por: DevKit-tester após POST_IMPLEMENT

2️⃣  NATIVA SEGUIDA POR EXTERNA → QUANDO:
    - Primeiro executar `revisao-owasp` (tática/codebase)
    - Depois invocar `security-auditor` (estratégica/systems)
    - Agente: DevKit-tester + DevKit-sre em fase POST_VALIDATE
    ✅ Combinação sinergilica para high-risk systems

3️⃣  EXTERNA `security-auditor` SOZINHA → QUANDO:
    - Arquitetura de segurança (não implementação)
    - Planejamento de compliance (SOC2, GDPR, etc.)
    - Threat modeling de sistema inteiro
    - Agente: DevKit-arquitetura em PRE_TASK
    ✅ Recomendado por: DevKit-cerebro em contexto Enterprise
```

#### Implementação

**No orquestrador (`devkit-orquestrador.agent.md`):**

```markdown
## Roteamento de Skills: Conflito revisao-owasp vs security-auditor

Quando a tarefa envolver segurança:

1. **Se for code review de endpoint** → invoque `revisao-owasp`
2. **Se revisão OWASP passar** → considere `security-auditor` para risk assessment sistêmico
3. **Se for planejamento arquitetural** → pule direto para `security-auditor`
4. **Se for enterprise/compliance** → `security-auditor` é obrigatória

Nunca invocar ambas no mesmo contexto sem sequência clara.
```

---

### 2️⃣ Design de Frontend

| Dimensão | Details |
|---|---|
| **Skill Nativa** | `frontend-design` (`.agents/skills/frontend-design/SKILL.md`) |
| **Skill Externa** | N/A — `frontend-design` importada É a skill externa |
| **Tipo de Conflito** | Nenhum conflito (skill ÚNICA) |
| **Status** | ✅ SEM CONFLITO NESTE LOTE |

**Nota:** A skill `frontend-design` foi importada com sucesso do antigravity-awesome-skills. Não há equivalente nativa conflitante. A skill `branding-react` nativa é diferente (relacionada à identidade visual, não design de interfaces genérico).

---

### 3️⃣ Lint e Validação

| Dimensão | Details |
|---|---|
| **Skill Nativa** | `lint-and-validate` (`.github/skills/lint-and-validate/SKILL.md`) |
| **Skill Externa** | `lint-and-validate` (`.agents/skills/lint-and-validate/SKILL.md`) |
| **Tipo de Conflito** | As MESMAS skill importadas em 2 ambientes |
| **Status** | ✅ NÃO É CONFLITO — é duplicação intencional |

**Explicação:** O import script duplica skills em ambos os ambientes (**Copilot** via `.github/` e **Antigravity** via `.agents/`) por design. Não há conflito aqui, apenas paridade multi-ambiente.

---

### 4️⃣ Test-Driven Development

| Dimensão | Details |
|---|---|
| **Skill Nativa** | `test-driven-development` (`.github/skills/test-driven-development/SKILL.md`) |
| **Skill Externa** | `test-driven-development` (`.agents/skills/test-driven-development/SKILL.md`) |
| **Tipo de Conflito** | Duplicação intencional entre ambientes |
| **Status** | ✅ NÃO É CONFLITO |

---

### 5️⃣ Debugging

| Dimensão | Details |
|---|---|
| **Skill Nativa** | `debugging-strategies` (`.agents/skills/debugging-strategies/SKILL.md`) |
| **Skill Externa** | `debugging-strategies` (importada do antigravity) |
| **Tipo de Conflito** | Duplicação intencional |
| **Status** | ✅ NÃO É CONFLITO |

---

## Resumo de Decisões

| Skill Nativa | Skill Externa | Status | Precedência | Ação |
|---|---|---|---|---|
| `revisao-owasp` | `security-auditor` | 🟡 CONFLITO | Nativa primeiro | Documentar sequência |
| `frontend-design` | — | ✅ Única | N/A | Nenhuma ação |
| `lint-and-validate` | `lint-and-validate` | ✅ Intencional | Qualquer uma | Documentar paridade |
| `test-driven-development` | `test-driven-development` | ✅ Intencional | Qualquer uma | Documentar paridade |
| `debugging-strategies` | `debugging-strategies` | ✅ Intencional | Qualquer uma | Nenhuma ação |

---

## Protocolo de Invocação

### Agentes × Skills Conflitantes

**DevKit-backend (Agente especializado em implementação):**
```yaml
hooks:
  POST_IMPLEMENT:
    - invoke: revisao-owasp  # SEMPRE primeiro
    - context: output do POST_IMPLEMENT (código do endpoint)
    
  POST_VALIDATE:
    - invoke: security-auditor # DEPOIS (contexto de sistema)
    - context: endpoint + API contract + threat model
```

**DevKit-tester (Agente de QA):**
```yaml
lifecycle:
  1. Execute suite de testes (test-driven-development)
  2. Code review (lint-and-validate + revisao-owasp)
  3. Compliance check (security-auditor se enterprise)
```

**DevKit-arquitetura (Agente de planejamento):**
```yaml
lifecycle:
  PRE_TASK:
    - invoke: security-auditor # Direto para visão sistêmica
    - context: requisitos não-funcionais + compliance
```

---

## Adendum: Skills com Dependências Externas (Removidas)

As seguintes skills foram **removidas** do mapeamento por terem dependências não importadas:

| Skill Removida | Razão | Dependências Quebradas |
|---|---|---|
| `api-documentation` | Dependências ausentes | `api-documenter`, `openapi-spec-generation`, `api-documentation-generator`, `documentation-templates` |
| `create-pr` | Alias inútil para `sentry-skills:pr-writer` | `sentry-skills:pr-writer` (não implementada) |

**Status:** Removidas de `selectedSkills` no `antigravity-skill-map.json`  
**Revisão Futura:** Podem ser reimportadas em Phase 2 se dependências forem trazidas.

---

## Próxima Triagem

Quando novas skills forem importadas do antigravity:

1. **Validar dependências externas** — nenhuma skill pode referenciar skills não trazidas
2. **Verificar conflitos funcionais** — comparar com skills nativas
3. **Documentar precedência** — adicionar nova linha nesta matrix
4. **Testar composição** — executar hook de validação antes de merge

---

## Referências

- `.github/agents/devkit-orquestrador.agent.md` — Orchestrator routing logic
- `.agents/workflows/orquestrador.md` — Antigravity equivalent
- `scripts/antigravity-skill-map.json` — Mapeamento de skills
- `.github/hooks/POST_IMPLEMENT.md` — Lifecycle hook de validação
- `.github/skills/revisao-owasp/SKILL.md` — Detalhes da skill nativa
- `.agents/skills/security-auditor/SKILL.md` — Detalhes da skill externa

