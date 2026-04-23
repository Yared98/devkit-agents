# Análise de Dependências Externas Quebradas

Data: 23 de abril de 2026  
Status: 🔴 **CRÍTICO** - Identificadas 5 dependências ausentes

---

## Resumo Executivo

| Skill Importada | Tipo de Problema | Dependências Quebradas | Impacto |
|---|---|---|---|
| `api-documentation` | Referências a skills não importadas | 4 skills | 🔴 CRÍTICO - Workflow incompleto |
| `create-pr` | Alias para skill externa não existente | 1 workflow (Sentry) | 🟠 MÉDIO - Redirecionamento quebrado |

---

## Detalhamento por Skill

### 1. `api-documentation` (CRÍTICO)

**Localização:** 
- `.agents/skills/api-documentation/SKILL.md`
- `.github/skills/api-documentation/SKILL.md`

**Dependências Quebradas:**

| Referência | Fase | Tipo | Status no Lote |
|---|---|---|---|
| `api-documenter` | Phase 1, 2, 3 | skill | ❌ NÃO IMPORTADA |
| `openapi-spec-generation` | Phase 2 | skill | ❌ NÃO IMPORTADA |
| `api-documentation-generator` | Phase 3 | skill | ❌ NÃO IMPORTADA |
| `documentation-templates` | Phase 3 | skill | ❌ NÃO IMPORTADA |

**Impacto:**
- Se um agente invocar `api-documentation`, as instruções "Use @api-documenter..." estarão apontando para skills inexistentes
- Os "Copy-Paste Prompts" não funcionarão corretamente
- O workflow está **50% quebrado** (Phase 1 parcial + Phase 2 e 3 completamente indisponíveis)

**Linha exata do problema:**
```markdown
#### Skills to Invoke
- `api-documenter` - API documentation  ← ❌ NÃO EXISTE
- `api-design-principles` - API design    ← ✅ EXISTE (importada)

...

- `openapi-spec-generation` - OpenAPI     ← ❌ NÃO EXISTE
- `api-documenter` - API specs           ← ❌ NÃO EXISTE

...

- `api-documentation-generator` - Documentation  ← ❌ NÃO EXISTE
- `documentation-templates` - Templates          ← ❌ NÃO EXISTE
```

---

### 2. `create-pr` (MÉDIO)

**Localização:** 
- `.agents/skills/create-pr/SKILL.md`
- `.github/skills/create-pr/SKILL.md`

**Dependência Quebrada:**

| Referência | Tipo | Status |
|---|---|---|
| `sentry-skills:pr-writer` | workflow externo | ❌ NÃO IMPLEMENTADO |

**Impacto:**
- A skill funciona como **alias de redirecionamento** apenas
- Se invocada, dirá: "use `sentry-skills:pr-writer` em vez disso"
- Mas `sentry-skills:pr-writer` **não existe** no DevKit
- Isto é uma **quebra de convenção** (alias inútil)

**Linha exata do problema:**
```markdown
Use `sentry-skills:pr-writer` as the canonical skill for creating and editing pull requests.

If invoked via `create-pr`, run the same workflow and conventions documented in `sentry-skills:pr-writer`.
```

---

## Recomendações de Correção

### Opção A: **Remover Skills Quebradas** (Abordagem Conservadora)
- ❌ Remover `api-documentation` de ambos os ambientes (`.agents/` e `.github/`)
- ❌ Remover `create-pr` de ambos os ambientes
- ✅ Motivo: Evita invocação acidental de workflows incompletos
- ⏱️ Tempo: 5 min
- 📊 Risco: BAIXO (skills removidas não causam danos)

### Opção B: **Sanitizar com Fallbacks** (Abordagem Evolutiva)
- ✏️ Manter `api-documentation` com Phase 1 completa (remover Phase 2 e 3)
- ✏️ Reescrever `create-pr` como workflow local alternativo
- ✅ Motivo: Aproveita 50% do `api-documentation`, oferece PR workflow local
- ⏱️ Tempo: 20 min
- 📊 Risco: MÉDIO (requer decisão sobre implementação local de PR)

### Opção C: **Importar Skills Dependentes** (Abordagem Completa)
- ✅ Executar import com 4 skills adicionais: `api-documenter`, `openapi-spec-generation`, `api-documentation-generator`, `documentation-templates`
- ✅ Reescrever `create-pr` com novo workflow
- ✅ Motivo: Completa todos os workflows, sem remover nada
- ⏱️ Tempo: 30 min + nova execução do script
- 📊 Risco: ALTO (adiciona 4 skills novas ao mapeamento, potencial context bloat)

---

## Matriz de Decisão

| Critério | Opção A (Remover) | Opção B (Sanitizar) | Opção C (Completar) |
|---|---|---|---|
| **Rapidez** | ⚡ Muito rápido | ⏱️ Moderado | 🐢 Lento |
| **Risco** | ✅ Baixo | ⚠️ Médio | ⚠️ Alto |
| **Mantém valor** | ❌ Nenhum | 🟡 Parcial (50%) | ✅ Total (100%) |
| **Context bloat** | ✅ Reduz | ⚠️ Mantém | ❌ Adiciona |
| **Recomendado para** | **MVP rápido** | **Incremento gradual** | **Long-term completude** |

---

## Recomendação Final

✅ **Sugerido: Opção A (Remover) para Passo 1 - Rapidez e Simplicidade**

Razão: 
- DevKit está em fase de estabilização de habilidades externas
- Skills quebradas aumentam risco de indução de erro em agentes
- Fácil de reverter em Passo 2 se necessário
- Limpa o workspace para próximas importações

---

## Próximos Passos

**Passo 1.1:** ✅ Identificar dependências (CONCLUÍDO)

**Passo 1.2:** ⏳ Remover skills quebradas (Opção A recomendada)
- Deletar `.agents/skills/api-documentation`
- Deletar `.agents/skills/create-pr`
- Deletar `.github/skills/api-documentation`
- Deletar `.github/skills/create-pr`
- Atualizar `scripts/antigravity-skill-map.json` (remover de selectedSkills)
- Executar `git rm` para rastrear deleções

**Passo 1.3:** ⏳ Validar estado final
- Verificar que nenhuma referência órfã permanece
- Executar lint/validation
- Atualizar README/ANTIGRAVITY.md com notas da correção

**Passo 2:** ⏳ Conflict Resolution Matrix (próxima fase)

