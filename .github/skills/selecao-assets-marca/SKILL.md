---
name: selecao-assets-marca
description: "Seleciona logo, simbolo, icones e elementos do projeto por contexto de uso (tema, fundo, tamanho e objetivo da interface). Le estrutura de .github/brand/. Use quando: escolher assets para header, sidebar, avatar, favicon, cards e dashboards."
user-invocable: true
---

# Selecao de Assets de Marca

## Passo 1 — Verificar Assets Disponiveis

Antes de recomendar qualquer asset, liste os arquivos presentes em `.github/brand/`:

```
.github/brand/
  logos/          ← variacoes do logo (png, svg)
  symbols/        ← simbolo/icone isolado
  icons/          ← icones de interface
  shapes/         ← elementos graficos de apoio
  fonts/          ← arquivos de fonte
  guide.txt       ← regras e nomenclatura definidos pelo projeto
```

Se a pasta `logos/` estiver vazia, informe o usuario que os assets precisam ser adicionados seguindo `.github/brand/guide.txt`.

## Convencao de Nomenclatura Recomendada

Nao e obrigatoria, mas facilita o uso pelas skills:

### Logos — `.github/brand/logos/`

| Arquivo sugerido | Usar quando |
|---|---|
| `logo-on-light.{png,svg}` | Header/nav em fundo claro |
| `logo-on-dark.{png,svg}` | Header/nav em fundo escuro |
| `logo-black.{png,svg}` | Impresso preto e branco |
| `logo-white.{png,svg}` | Fundo preto solido |
| `logo-v-on-light.{png,svg}` | Splash/hero centralizado, fundo claro |
| `logo-v-on-dark.{png,svg}` | Splash/hero centralizado, fundo escuro |

### Simbolo Isolado — `.github/brand/symbols/`

| Arquivo sugerido | Usar quando |
|---|---|
| `symbol-on-light.{png,svg}` | Favicon, avatar, fundo claro |
| `symbol-on-dark.{png,svg}` | Favicon, avatar, fundo escuro |
| `symbol-black.{png,svg}` | Impresso monocromatico |

### Icones — `.github/brand/icons/`

Organize por tema claro/escuro se necessario:
- `icons/light/` — versoes para fundo claro
- `icons/dark/` — versoes para fundo escuro

## Regras de Selecao

- Fundo claro → usar variacao `on-light` ou `black`
- Fundo escuro → usar variacao `on-dark` ou `white`
- Avatar/favicon → usar simbolo isolado (`symbols/`)
- Contraste minimo WCAG AA obrigatorio
- Consultar `guide.txt` para restricoes especificas do projeto

## Output Esperado

- Lista objetiva dos arquivos corretos para cada contexto de UI
- Decisao de variacao baseada em contraste e legibilidade
- Instrucao de onde copiar o asset para `public/brand/` no projeto
