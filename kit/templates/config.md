# DevKit — Configuração do Toolkit

Este arquivo define o identidade e comportamento padrão de todos os agentes e skills do DevKit.
Edite-o antes de iniciar o desenvolvimento do seu projeto.

---

## Projeto

```yaml
name: "Meu Projeto"
description: "Descrição breve do que o projeto faz."
repo: "github.com/usuario/repositorio"
```

## Identidade Visual

> Veja `.devkit/brand.md` para instruções de preenchimento completo.

```yaml
brand:
  name: "Meu Projeto"
  style: "minimalista"          # minimalista | bold | playful | corporate
  primary_color: "#6366F1"      # cor principal — botões, links, destaques
  secondary_color: "#0F172A"    # cor de apoio
  background_light: "#FFFFFF"
  background_dark: "#0F172A"
  font_family: "Inter"          # família tipográfica principal
  font_code: "JetBrains Mono"   # fonte para blocos de código
  assets_path: ".devkit"
```

## Stack Padrão

> Preencha conforme decidido na fase de arquitetura ou deixe em branco para o agente decidir.

```yaml
stack:
  backend: ""         # ex: node | python | go | java | rust | dotnet
  frontend: ""        # ex: react | nextjs | blazor | aspnetcore-mvc
  database: ""        # ex: postgresql | mysql | mongodb | sqlite
  orm: ""             # ex: prisma | sqlx | hibernate | ef-core
  cloud: ""           # ex: azure | aws | gcp | none
  container: ""       # ex: docker | podman | none
```

## Convenções de Código

```yaml
conventions:
  language: "pt-BR"             # idioma da documentação e comentários
  test_framework: ""            # ex: jest | vitest | pytest | junit | xunit
  api_style: "REST"             # REST | GraphQL | gRPC
  auth: ""                      # ex: jwt | oauth2 | keycloak | none
  commit_convention: "conventional-commits"
```
