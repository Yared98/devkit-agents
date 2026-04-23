---
name: qa-identidade-visual
description: "Executa validacao final da interface segundo as regras de identidade visual do projeto, lendo toolkit.config.md e .github/brand/guide.txt. Use quando: revisar PRs de frontend e aprovar entregas visuais."
user-invocable: true
---

# QA de Identidade Visual

## Passo 1 — Ler Configuracao do Projeto

Antes de executar o checklist, leia:
1. `toolkit.config.md` — secao `brand:` para paleta, tipografia e dimensoes
2. `.github/brand/guide.txt` — regras especificas do projeto, proibicoes e dimensoes minimas

Se nao existirem, sinalize ao usuario que as configuracoes de marca nao foram definidas.

## Checklist Obrigatorio

### Marca

- [ ] Logo/simbolo usado na variacao correta para o fundo (claro/escuro)
- [ ] Tamanho minimo respeitado (consultar guide.txt; padrao: 120px horizontal, 40px vertical, 32px favicon)
- [ ] Area de respiro preservada ao redor da assinatura

### Cores

- [ ] Apenas paleta oficial aplicada (definida em `toolkit.config.md` secao `brand:`)
- [ ] Cor primaria nao usada como fundo dominante sem justificativa
- [ ] Contraste suficiente WCAG AA entre foreground e background

### Tipografia

- [ ] Familia da fonte correta aplicada (`brand.font_family`)
- [ ] Titulos em peso Bold/ExtraBold (700-800)
- [ ] Subtitulos em peso SemiBold/Bold (600-700)
- [ ] Corpo em peso Regular (400)
- [ ] Texto alinhado a esquerda (salvo override em guide.txt)
- [ ] Sem texto justificado ou alinhado a direita

### Proibicoes

- [ ] Sem rotacao de logo/simbolo
- [ ] Sem distorcao de proporcao
- [ ] Sem sombra/degrade nos assets de marca
- [ ] Sem alteracao de cores fora da paleta do config
- [ ] Sem aplicacao em fundo que comprometa legibilidade

## Resultado de QA

Classificar cada tela/componente:
- **Aprovado**
- **Aprovado com ressalvas**
- **Reprovado**

Para cada nao conformidade, reportar:
- Regra violada
- Arquivo/tela impactada
- Correcao objetiva recomendada

## Output Esperado

- Lista de conformidades e nao conformidades
- Status final por tela/componente
- Plano de ajustes antes de aprovar release visual
