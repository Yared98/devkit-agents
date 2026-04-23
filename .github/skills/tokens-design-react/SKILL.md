---
name: tokens-design-react
description: "Implementa tokens de design do projeto em React/Next.js com CSS variables e Tailwind, lendo as cores e tipografia de toolkit.config.md. Use quando: configurar design system, tema global e padroes de componentes."
user-invocable: true
---

# Tokens de Design no Frontend React

## Objetivo

Padronizar a identidade visual do projeto em tokens reutilizaveis para componentes e paginas, lidos de `toolkit.config.md`.

## Passo 1 — Ler toolkit.config.md

Leia a secao `brand:` do `toolkit.config.md` e extraia:
- `brand.primary_color` → `--brand-primary`
- `brand.secondary_color` → `--brand-secondary`
- `brand.background_light` → `--brand-bg-light`
- `brand.background_dark` → `--brand-bg-dark`
- `brand.font_family` → familia tipografica

## Tokens de Cor (Gerados a partir do Config)

```css
/* globals.css — substitua os valores pelos do toolkit.config.md */
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

## Tipografia

Use `brand.font_family` do config. Se for Google Fonts, use `next/font`. Se houver arquivos em `.github/brand/fonts/`, configure `@font-face`.

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

## Exemplo Tailwind Config

```ts
// tailwind.config.ts — adapte com os valores do toolkit.config.md
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

## Escala Minima para Marca

Consulte `.github/brand/guide.txt`. Valores padrao:
- Logo horizontal >= `120px`
- Logo vertical >= `40px`
- Favicon >= `32px`

## Output Esperado

- Tokens CSS derivados do toolkit.config.md aplicados globalmente
- Componentes usando variaveis/tokens em vez de valores hardcoded
- Tipografia configurada com hierarquia correta
