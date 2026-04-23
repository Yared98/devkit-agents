---
name: tokens-design-react
description: "Implementa tokens de design DevKit em React/Next.js com CSS variables e Tailwind, garantindo consistencia de cores, tipografia e escala visual. Use quando: configurar design system, tema global e padroes de componentes."
user-invocable: true
---

# Tokens de Design no Frontend React

## Objetivo

Padronizar a identidade visual DevKit em tokens reutilizaveis para componentes e paginas.

## Tokens de Cor (Obrigatorios)

```css
:root {
  --es-purple: #7852ea;
  --es-black: #000000;
  --es-white: #ffffff;

  --es-gray-1: #e9f2f4;
  --es-gray-2: #f5f5f5;
  --es-gray-3: #f4f1fd;
}
```

Uso recomendado:
- `--es-purple`: botoes primarios, links, foco e elementos de destaque
- `--es-black` e `--es-white`: base de fundo/texto
- `--es-gray-*`: superfices, bordas, divisores e backgrounds suaves

Restricao:
- Evitar `--es-purple` como fundo predominante de pagina inteira

## Tipografia Sora

Fontes da marca em `.github/brand/fonts/`: `Sora-Regular.ttf`, `Sora-Bold.ttf`, `Sora-SemiBold.ttf`, `Sora-ExtraBold.ttf`

```css
@font-face {
  font-family: 'Sora';
  src: url('/fonts/Sora-Regular.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
}
```

Hierarquia:
- h1/h2: 800 (ExtraBold)
- h3/h4: 600 ou 700 (SemiBold/Bold)
- body: 400 (Regular)

Alinhamento:
- Sempre `text-align: left`
- Proibido justificar texto

## Exemplo Tailwind

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        es: {
          purple: '#7852EA',
          black: '#000000',
          white: '#FFFFFF',
          gray1: '#E9F2F4',
          gray2: '#F5F5F5',
          gray3: '#F4F1FD',
        },
      },
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
      },
    },
  },
};
```

## Escala Minima para Marca

- Logo horizontal >= `90px`
- Logo vertical >= `70px`
- Favicon >= `20px`

## Output Esperado

- Tokens aplicados globalmente
- Components usando variaveis/tokens em vez de valores hardcoded
- Tipografia Sora configurada com hierarquia correta
