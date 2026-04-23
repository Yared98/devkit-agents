---
name: qa-identidade-visual
description: "Executa validacao final da interface segundo as regras de identidade visual DevKit, incluindo contraste, tipografia, escalas minimas e usos proibidos. Use quando: revisar PRs de frontend e aprovar entregas visuais."
user-invocable: true
---

# QA de Identidade Visual DevKit

## Checklist Obrigatorio

### Marca

- [ ] Logo/simbolo usado na variacao correta para o fundo
- [ ] Tamanho minimo respeitado (90px horizontal, 70px vertical, 20px favicon)
- [ ] Area de respiro preservada ao redor da assinatura

### Cores

- [ ] Apenas paleta oficial aplicada (`#7852EA`, `#000000`, `#FFFFFF`, `#E9F2F4`, `#F5F5F5`, `#F4F1FD`)
- [ ] Roxo nao usado como fundo dominante sem justificativa
- [ ] Contraste suficiente entre foreground e background

### Tipografia

- [ ] Familia Sora aplicada
- [ ] Titulos em ExtraBold
- [ ] Subtitulos em SemiBold/Bold
- [ ] Corpo em Regular
- [ ] Texto alinhado a esquerda
- [ ] Sem texto justificado ou alinhado a direita

### Proibicoes

- [ ] Sem rotacao de logo/simbolo
- [ ] Sem distorcao de proporcao
- [ ] Sem sombra/degrade nos ativos de marca
- [ ] Sem alteracao de cores e tipografia oficiais
- [ ] Sem aplicacao em fundo que comprometa legibilidade

### Midias Sociais

- [ ] Avatar com simbolo isolado em 1080x1080 quando aplicavel

## Resultado de QA

Classificar cada tela/componente:
- Aprovado
- Aprovado com ressalvas
- Reprovado

Para cada nao conformidade, reportar:
- Regra violada
- Arquivo/tela impactada
- Correcao objetiva recomendada

## Output Esperado

- Lista de conformidades e nao conformidades
- Status final por tela/componente
- Plano de ajustes antes de aprovar release visual
