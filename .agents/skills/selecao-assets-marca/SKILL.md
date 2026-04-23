---
name: selecao-assets-marca
description: "Seleciona logo, simbolo, icones e elementos DevKit por contexto de uso (tema, fundo, tamanho e objetivo da interface). Use quando: escolher assets para header, sidebar, avatar, favicon, cards e dashboards."
user-invocable: true
---

# Selecao de Assets de Marca

## Base de Assets Organizados

- Pasta base: `.github/brand/`
- Estrutura plana — sem subpastas intermediarias

## Mapa de Uso por Cenario

### Logos — `.github/brand/logos/`

| Arquivo | Usar quando |
|---|---|
| `logo-h-on-light.png` | Header em fundo claro |
| `logo-h-on-dark.png` | Header em fundo escuro |
| `logo-h-on-light-tag.png` | Material institucional, fundo claro |
| `logo-h-on-dark-tag.png` | Material institucional, fundo escuro |
| `logo-h-black.png` | Impresso preto e branco |
| `logo-h-white.png` | Fundo preto solido |
| `logo-v-on-light.png` | Splash / hero centralizado, fundo claro |
| `logo-v-on-dark.png` | Splash / hero centralizado, fundo escuro |
| `logo-v-black.png` | Impresso vertical, preto |
| `logo-v-white.png` | Impresso vertical, branco |

### Simbolo Isolado — `.github/brand/symbols/`

| Arquivo | Usar quando |
|---|---|
| `symbol-on-light.png` | Favicon, avatar, fundo claro |
| `symbol-on-dark.png` | Favicon, avatar, fundo escuro |
| `symbol-black.png` | Impresso monocromatico |
| `symbol-white.png` | Fundo preto solido |

### Icones — `.github/brand/icons/`

- Fundo claro → `icons/light/`: `search.png`, `alert.png`, `user.png`, `shield.png`, `analytics.png`, `donut.png`, `target.png`
- Fundo escuro → `icons/dark/`: mesmos 7 arquivos

### Shapes de Apoio — `.github/brand/shapes/`

- `circle-gray.png`, `circle-purple.png`
- `rect-h-gray.png`, `rect-h-purple.png`
- `rect-v-gray.png`, `rect-v-purple.png`
- `square-circle-gray.png`, `square-circle-purple.png`
- `square-gray.png`, `square-purple.png`

## Regras de Contraste

- Roxo com preto: ideal para fundo claro
- Roxo com branco: ideal para fundo escuro
- Nao aplicar logo sobre fundos com pouca legibilidade

## Output Esperado

- Lista objetiva de arquivos certos para cada contexto de UI
- Decisao de variacao baseada em contraste e legibilidade
