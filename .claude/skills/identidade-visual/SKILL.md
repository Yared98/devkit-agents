---
name: identidade-visual
description: "Aplica e confere a identidade visual do projeto em interfaces: cores, tipografia, tokens de design, escolha de logos/assets e checklist de QA visual. Use quando: criar ou revisar telas, componentes ou layouts, definir tokens de tema ou aprovar uma entrega de frontend."
---

# Identidade visual

A fonte de verdade da marca é `.devkit/brand.md` (e a seção `brand` de `.devkit/config.md`). Leia antes de criar qualquer interface. Se os valores ainda forem placeholders, pergunte ao usuário ou use o padrão descrito em `.devkit/config.md`.

## Aplicação da marca

### Quando Usar

- Antes de criar qualquer tela com elementos visuais da marca
- Ao revisar componentes existentes para alinhamento de identidade
- Quando houver duvida sobre qual variacao de logo, simbolo ou icone usar

### Passo 1 — Ler a Configuracao do Projeto

Antes de qualquer implementacao, leia:
1. `.devkit/config.md` — secao `brand:` para cores, tipografia e nome
2. `.devkit/brand.md` — regras de uso, dimensoes minimas e proibicoes
3. `.devkit/brand/logos/` — verifique quais variacoes de logo existem

Se `.devkit/config.md` nao existir, pergunte ao usuario os valores de cor primaria, tipografia e assets antes de continuar.

### Regras de Identidade (Lidas do Config)

- Estilo visual: definido em `brand.style` do .devkit/config.md
- Cor primaria: definida em `brand.primary_color` (usar como destaque; evitar como fundo dominante)
- Cor secundaria: definida em `brand.secondary_color`
- Tipografia: definida em `brand.font_family`

### Tipografia

Use a fonte definida em `brand.font_family` do .devkit/config.md.

- Titulos: Bold/ExtraBold (peso 700-800)
- Subtitulos: SemiBold/Bold (peso 600-700)
- Corpo: Regular (peso 400)
- Alinhamento: sempre a esquerda (configuravel em guide.txt)
- Proibido: texto justificado ou alinhado a direita (salvo override em guide.txt)
- Texto pequeno: preferir Bold para legibilidade

### Regras de Aplicacao

- Nunca rotacionar a marca
- Nunca distorcer proporcoes
- Nunca aplicar sombra ou degrade no logo/simbolo
- Nunca trocar cores fora da paleta definida em .devkit/config.md
- Garantir contraste minimo WCAG AA no fundo

### Dimensoes Minimas

Consulte `.devkit/brand.md` para os valores definidos pelo projeto.
Valores padrao se nao configurados:
- Logo horizontal: `120px`
- Logo vertical: `40px`
- Favicon: `32px`

### Fluxo Recomendado

1. Ler `.devkit/config.md` — secao `brand:`
2. Ler `.devkit/brand.md` — regras e proibicoes
3. Definir tema da tela (claro/escuro)
4. Escolher variacao correta de logo/simbolo da pasta `brand/`
5. Aplicar tokens de cor e tipografia via CSS variables ou Tailwind
6. Validar tamanho minimo e contraste

### Output Esperado

- Interface React alinhada a identidade do projeto
- Todas as cores e fontes via tokens (sem hardcode nos componentes)
- Variacoes de logo corretas para cada contexto (fundo claro/escuro)
- Nenhuma violacao das proibicoes definidas em guide.txt

## Tokens de design

### Objetivo

Padronizar a identidade visual do projeto em tokens reutilizaveis para componentes e paginas, lidos de `.devkit/config.md`.

### Passo 1 — Ler .devkit/config.md

Leia a secao `brand:` do `.devkit/config.md` e extraia:
- `brand.primary_color` → `--brand-primary`
- `brand.secondary_color` → `--brand-secondary`
- `brand.background_light` → `--brand-bg-light`
- `brand.background_dark` → `--brand-bg-dark`
- `brand.font_family` → familia tipografica

### Tokens de Cor (Gerados a partir do Config)

```css
/* globals.css — substitua os valores pelos do .devkit/config.md */
:root {
  --brand-primary: /* brand.primary_color */;
  --brand-secondary: /* brand.secondary_color */;
  --brand-bg-light: /* brand.background_light */;
  --brand-bg-dark: /* brand.background_dark */;
  --brand-neutral-100: /* neutral-100 */;
  --brand-neutral-200: /* neutral-200 */;
  --brand-neutral-300: /* neutral-300 */;
}
```

Uso recomendado:
- `--brand-primary`: botoes primarios, links, foco e destaques
- `--brand-secondary`: hover, badges, elementos de apoio
- `--brand-bg-*`: fundos de pagina por tema
- `--brand-neutral-*`: superficies, bordas, divisores

Restricao:
- Evitar `--brand-primary` como fundo dominante de pagina inteira

### Tipografia

Use `brand.font_family` do config. Se for Google Fonts, use `next/font`. Se houver arquivos em `.devkit/brand/fonts/`, configure `@font-face`.

```css
/* Se usar arquivos locais */
@font-face {
  font-family: 'SuaFonte';
  src: url('/fonts/SuaFonte-Regular.ttf') format('truetype');
  font-weight: 400;
}
```

Hierarquia:
- h1/h2: peso 700-800
- h3/h4: peso 600-700
- body: peso 400

Alinhamento:
- Sempre `text-align: left` (salvo override em guide.txt)
- Proibido justificar texto

### Exemplo Tailwind Config

```ts
// tailwind.config.ts — adapte com os valores do .devkit/config.md
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary)',
          secondary: 'var(--brand-secondary)',
          bgLight: 'var(--brand-bg-light)',
          bgDark: 'var(--brand-bg-dark)',
        },
      },
      fontFamily: {
        brand: ['SuaFonte', 'sans-serif'], // substituir pelo font_family
      },
    },
  },
};
```

### Escala Minima para Marca

Consulte `.devkit/brand.md`. Valores padrao:
- Logo horizontal >= `120px`
- Logo vertical >= `40px`
- Favicon >= `32px`

### Output Esperado

- Tokens CSS derivados do .devkit/config.md aplicados globalmente
- Componentes usando variaveis/tokens em vez de valores hardcoded
- Tipografia configurada com hierarquia correta

## Seleção de assets

### Passo 1 — Verificar Assets Disponiveis

Antes de recomendar qualquer asset, liste os arquivos presentes em `.devkit/brand/`:

```
.devkit/brand/
  logos/          ← variacoes do logo (png, svg)
  symbols/        ← simbolo/icone isolado
  icons/          ← icones de interface
  shapes/         ← elementos graficos de apoio
  fonts/          ← arquivos de fonte
  guide.txt       ← regras e nomenclatura definidos pelo projeto
```

Se a pasta `logos/` estiver vazia, informe o usuario que os assets precisam ser adicionados seguindo `.devkit/brand.md`.

### Convencao de Nomenclatura Recomendada

Nao e obrigatoria, mas facilita o uso pelas skills:

#### Logos — `.devkit/brand/logos/`

| Arquivo sugerido | Usar quando |
|---|---|
| `logo-on-light.{png,svg}` | Header/nav em fundo claro |
| `logo-on-dark.{png,svg}` | Header/nav em fundo escuro |
| `logo-black.{png,svg}` | Impresso preto e branco |
| `logo-white.{png,svg}` | Fundo preto solido |
| `logo-v-on-light.{png,svg}` | Splash/hero centralizado, fundo claro |
| `logo-v-on-dark.{png,svg}` | Splash/hero centralizado, fundo escuro |

#### Simbolo Isolado — `.devkit/brand/symbols/`

| Arquivo sugerido | Usar quando |
|---|---|
| `symbol-on-light.{png,svg}` | Favicon, avatar, fundo claro |
| `symbol-on-dark.{png,svg}` | Favicon, avatar, fundo escuro |
| `symbol-black.{png,svg}` | Impresso monocromatico |

#### Icones — `.devkit/brand/icons/`

Organize por tema claro/escuro se necessario:
- `icons/light/` — versoes para fundo claro
- `icons/dark/` — versoes para fundo escuro

### Regras de Selecao

- Fundo claro → usar variacao `on-light` ou `black`
- Fundo escuro → usar variacao `on-dark` ou `white`
- Avatar/favicon → usar simbolo isolado (`symbols/`)
- Contraste minimo WCAG AA obrigatorio
- Consultar `guide.txt` para restricoes especificas do projeto

### Output Esperado

- Lista objetiva dos arquivos corretos para cada contexto de UI
- Decisao de variacao baseada em contraste e legibilidade
- Instrucao de onde copiar o asset para `public/brand/` no projeto

## QA visual

### Passo 1 — Ler Configuracao do Projeto

Antes de executar o checklist, leia:
1. `.devkit/config.md` — secao `brand:` para paleta, tipografia e dimensoes
2. `.devkit/brand.md` — regras especificas do projeto, proibicoes e dimensoes minimas

Se nao existirem, sinalize ao usuario que as configuracoes de marca nao foram definidas.

### Checklist Obrigatorio

#### Marca

- [ ] Logo/simbolo usado na variacao correta para o fundo (claro/escuro)
- [ ] Tamanho minimo respeitado (consultar guide.txt; padrao: 120px horizontal, 40px vertical, 32px favicon)
- [ ] Area de respiro preservada ao redor da assinatura

#### Cores

- [ ] Apenas paleta oficial aplicada (definida em `.devkit/config.md` secao `brand:`)
- [ ] Cor primaria nao usada como fundo dominante sem justificativa
- [ ] Contraste suficiente WCAG AA entre foreground e background

#### Tipografia

- [ ] Familia da fonte correta aplicada (`brand.font_family`)
- [ ] Titulos em peso Bold/ExtraBold (700-800)
- [ ] Subtitulos em peso SemiBold/Bold (600-700)
- [ ] Corpo em peso Regular (400)
- [ ] Texto alinhado a esquerda (salvo override em guide.txt)
- [ ] Sem texto justificado ou alinhado a direita

#### Proibicoes

- [ ] Sem rotacao de logo/simbolo
- [ ] Sem distorcao de proporcao
- [ ] Sem sombra/degrade nos assets de marca
- [ ] Sem alteracao de cores fora da paleta do config
- [ ] Sem aplicacao em fundo que comprometa legibilidade

### Resultado de QA

Classificar cada tela/componente:
- **Aprovado**
- **Aprovado com ressalvas**
- **Reprovado**

Para cada nao conformidade, reportar:
- Regra violada
- Arquivo/tela impactada
- Correcao objetiva recomendada

### Output Esperado

- Lista de conformidades e nao conformidades
- Status final por tela/componente
- Plano de ajustes antes de aprovar release visual
