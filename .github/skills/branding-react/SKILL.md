---
name: branding-react
description: "Aplica identidade visual do projeto em interfaces React/Next.js. Le configuracoes de toolkit.config.md e .github/brand/guide.txt. Use quando: criar telas, componentes, layouts ou qualquer UI que use a marca do projeto."
user-invocable: true
---

# Branding em React

## Quando Usar

- Antes de criar qualquer tela com elementos visuais da marca
- Ao revisar componentes existentes para alinhamento de identidade
- Quando houver duvida sobre qual variacao de logo, simbolo ou icone usar

## Passo 1 — Ler a Configuracao do Projeto

Antes de qualquer implementacao, leia:
1. `toolkit.config.md` — secao `brand:` para cores, tipografia e nome
2. `.github/brand/guide.txt` — regras de uso, dimensoes minimas e proibicoes
3. `.github/brand/logos/` — verifique quais variacoes de logo existem

Se `toolkit.config.md` nao existir, pergunte ao usuario os valores de cor primaria, tipografia e assets antes de continuar.

## Regras de Identidade (Lidas do Config)

- Estilo visual: definido em `brand.style` do toolkit.config.md
- Cor primaria: definida em `brand.primary_color` (usar como destaque; evitar como fundo dominante)
- Cor secundaria: definida em `brand.secondary_color`
- Tipografia: definida em `brand.font_family`

## Tipografia

Use a fonte definida em `brand.font_family` do toolkit.config.md.

- Titulos: Bold/ExtraBold (peso 700-800)
- Subtitulos: SemiBold/Bold (peso 600-700)
- Corpo: Regular (peso 400)
- Alinhamento: sempre a esquerda (configuravel em guide.txt)
- Proibido: texto justificado ou alinhado a direita (salvo override em guide.txt)
- Texto pequeno: preferir Bold para legibilidade

## Regras de Aplicacao

- Nunca rotacionar a marca
- Nunca distorcer proporcoes
- Nunca aplicar sombra ou degrade no logo/simbolo
- Nunca trocar cores fora da paleta definida em toolkit.config.md
- Garantir contraste minimo WCAG AA no fundo

## Dimensoes Minimas

Consulte `.github/brand/guide.txt` para os valores definidos pelo projeto.
Valores padrao se nao configurados:
- Logo horizontal: `120px`
- Logo vertical: `40px`
- Favicon: `32px`

## Fluxo Recomendado

1. Ler `toolkit.config.md` — secao `brand:`
2. Ler `.github/brand/guide.txt` — regras e proibicoes
3. Definir tema da tela (claro/escuro)
4. Escolher variacao correta de logo/simbolo da pasta `brand/`
5. Aplicar tokens de cor e tipografia via CSS variables ou Tailwind
6. Validar tamanho minimo e contraste

## Output Esperado

- Interface React alinhada a identidade do projeto
- Todas as cores e fontes via tokens (sem hardcode nos componentes)
- Variacoes de logo corretas para cada contexto (fundo claro/escuro)
- Nenhuma violacao das proibicoes definidas em guide.txt
