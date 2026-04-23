# DevKit — Agentes de Desenvolvimento

Sistema de agentes especializados para o desenvolvimento de aplicações, orquestrado pelo **DevKit Orquestrador**. Os agentes cobrem todas as camadas do ciclo de desenvolvimento: arquitetura, banco de dados, backend, frontend, infraestrutura e documentação.

> **Origem:** Este projeto é derivado de [edgesearchlabs/agentes-development](https://github.com/edgesearchlabs/agentes-development). Como o repositório original é privado, não foi possível realizar um fork formal — este repositório é uma adaptação independente com remoção de identidade visual proprietária e adição de configurabilidade genérica.

---

## Índice

- [Como ativar um agente](#como-ativar-um-agente)
- [Compatibilidade com Outros Ambientes](#compatibilidade-com-outros-ambientes)
- [Orquestrador](#orquestrador)
- [Agentes Especializados](#agentes-especializados)
- [Hierarquia de Agentes](#hierarquia-de-agentes)
- [Hooks de Ciclo de Vida](#hooks-de-ciclo-de-vida)
- [Skills Disponíveis](#skills-disponíveis)
- [Assets de Marca](#assets-de-marca)
- [Exemplos de Uso](#exemplos-de-uso)

---

## Como Ativar um Agente

No GitHub Copilot Chat (VS Code), selecione o agente no seletor de modo antes de enviar sua mensagem:

1. Abra o painel de chat do Copilot (`Ctrl+Shift+I` ou pelo ícone na barra lateral)
2. Clique no seletor de modo (padrão: **Ask** ou **Edit**)
3. Escolha o agente desejado na lista
4. Digite sua solicitação normalmente

> Todos os agentes entendem português. A tradução para inglês é feita automaticamente e de forma transparente pelo agente `DevKit Tradutor`.

---

## Compatibilidade com Outros Ambientes

O sistema DevKit foi originalmente construído para o **GitHub Copilot Chat** (VS Code), mas a contribuição da comunidade adicionou suporte completo ao **Claude Code** e ao **Antigravity**. Cada ambiente tem sua própria forma de invocar os agentes e uma pasta de configuração dedicada:

| Ambiente | Como invocar | Configuração | Documentação |
|---|---|---|---|
| **GitHub Copilot** (VS Code) | Seletor de modo no chat | `.github/agents/*.agent.md` | Este README |
| **Claude Code** (CLI / IDE) | Slash commands (`/orquestrador`, `/backend`, etc.) | `.claude/commands/*.md` + `CLAUDE.md` | [CLAUDE.md](CLAUDE.md) · [.claude/COMO-USAR.md](.claude/COMO-USAR.md) |
| **Antigravity** | Slash commands (`/orquestrador`, `/backend-dotnet`, etc.) | `.agents/workflows/*.md` | [ANTIGRAVITY.md](ANTIGRAVITY.md) |

### GitHub Copilot

Os agentes são registrados como modos customizados em `.github/agents/`. A identidade visual, stack e constraints de cada agente ficam nos arquivos `.agent.md` e são injetados automaticamente pelo Copilot Chat em cada sessão.

### Claude Code

O arquivo `CLAUDE.md` na raiz do repositório é lido automaticamente pelo Claude Code em toda sessão, fornecendo o protocolo de lifecycle hooks, a estrutura de context bank e o mapeamento de slash commands. Os comandos ficam em `.claude/commands/` e cada arquivo corresponde a um agente — por exemplo, `/orquestrador` carrega `.claude/commands/orquestrador.md`.

Os lifecycle hooks (`PRE_TASK`, `POST_IMPLEMENT`, `POST_VALIDATE`, `POST_SESSION`) são executados **pelo próprio Claude** lendo os arquivos em `.github/hooks/`, sem necessidade de sub-agentes separados para isso.

> Consulte [CLAUDE.md](CLAUDE.md) e [.claude/COMO-USAR.md](.claude/COMO-USAR.md) para instruções completas.

### Antigravity

O Antigravity lê nativamente a pasta `.agents/` e oferece três features exclusivas em relação aos outros ambientes:

- **Skills automáticas** — as skills em `.agents/skills/` são carregadas por heurística conforme a intenção detectada no prompt, sem necessidade de invocação explícita (diferente do Copilot e Claude, onde o agente invoca a skill por nome).
- **KIs (Knowledge Items)** — memória persistente cross-sessão gerada automaticamente ao final de cada task boundary. Na próxima sessão, o Antigravity recupera decisões arquiteturais, stack confirmada e contratos anteriores sem precisar reler o context bank manualmente.
- **Turbo Automation** — workflows marcados com `// turbo` em `.agents/workflows/` recebem aprovação automática de execução para scripts previsíveis (scaffolds, migrations simples), eliminando cliques manuais de confirmação.

> Consulte [ANTIGRAVITY.md](ANTIGRAVITY.md) para instruções completas.

---

## Orquestrador

**Agente: `DevKit Orquestrador`**

O ponto de entrada para qualquer desenvolvimento completo. Recebe sua solicitação, planeja as etapas e delega para os sub-agentes especializados na ordem correta.

### Quando usar

- Desenvolver uma aplicação do zero (parcial ou completa)
- Coordenar múltiplas camadas simultaneamente
- Não sabe qual sub-agente acionar — use o orquestrador

### Fluxo interno

```
Usuário
  └─► DevKit Orquestrador
        ├─► DevKit Tradutor        (tradução transparente — sempre primeiro)
        ├─► DevKit Cérebro         (estado do projeto e lifecycle hooks)
        │     ├─► PRE_TASK  → Context Brief antes de cada delegação
        │     ├─► POST_VALIDATE → atualiza estado + detecta conflitos
        │     └─► QUERY / AUDIT → consulta e auditoria cross-camada
        ├─► DevKit Arquitetura     (decisões de stack e estrutura)
        ├─► DevKit Banco de Dados  (modelagem e migrations)
        ├─► DevKit Backend         (API e regras de negócio)
        │     ├─► DevKit .NET Backend      (quando a stack for C#/.NET)
        │     ├─► DevKit Node.js Backend   (quando a stack for TypeScript/Node.js)
        │     ├─► DevKit Python Backend    (quando a stack for Python)
        │     ├─► DevKit Go Backend        (quando a stack for Go)
        │     ├─► DevKit Java Backend      (quando a stack for Java)
        │     └─► DevKit Rust Backend      (quando a stack for Rust)
        ├─► DevKit Frontend        (interface React/Next.js)
        ├─► DevKit Tester          (validação após cada camada — POST_IMPLEMENT)
        ├─► DevKit SRE             (Dockerfile, K8s, CI/CD)
        │     └─► DevKit SRE Investigador  (diagnóstico de falhas em produção)
        └─► DevKit Documentação    (README, ADR, guias)
```

### Exemplos de solicitação

```
Crie uma API REST de gerenciamento de pedidos com Node.js e PostgreSQL
```

```
Preciso de uma aplicação completa com frontend React, backend Java Spring Boot, PostgreSQL e deploy no AKS
```

```
Crie só o banco de dados para um sistema de usuários com perfis e permissões
```

### Delegação seletiva

Quando o pedido envolver apenas uma camada, o orquestrador aciona somente os agentes necessários:

| Pedido | Sub-agentes ativados |
|---|---|
| Criar o banco de dados | Banco de Dados |
| Criar o backend | Arquitetura → Backend |
| Criar backend em Rust | Arquitetura → Rust Backend |
| Criar backend em Java | Arquitetura → Java Backend |
| Criar backend em .NET | Arquitetura → .NET Backend |
| Criar backend em Node.js / TypeScript | Arquitetura → Node.js Backend |
| Criar backend em Python | Arquitetura → Python Backend |
| Criar backend em Go | Arquitetura → Go Backend |
| Criar API de alta performance | Arquitetura → Rust Backend (Rust sugerido) |
| Criar o frontend | Arquitetura → Frontend |
| Documentar o projeto | Documentação |
| Criar Dockerfile ou imagem | SRE |
| Deploy no AKS / EKS / GKE / OpenShift | SRE |
| Investigar pod com erro / logs / manifests | SRE Investigador |
| Pod em CrashLoopBackOff / 503 / OOMKilled | SRE Investigador |
| Testar / validar se funciona | Tester |
| Algo quebrou / erro ao rodar | Tester |
| Aplicação completa com infra | Todos, na ordem do fluxo |
| Aplicação completa sem infra | Todos exceto SRE |
| Gerar mensagem de commit / merge / tag | skill `git-workflow` (via Orquestrador ou Documentação) |

---

## Agentes Especializados

Cada agente pode ser ativado diretamente quando você já sabe qual camada trabalhar.

---

### DevKit Arquitetura

**Especialidade:** Arquitetura de software seguindo Clean Architecture e Clean Code (Robert C. Martin).

**Quando usar diretamente:**
- Definir a estrutura de pastas e camadas de uma nova aplicação
- Escolher entre frameworks e estilos arquiteturais
- Registrar decisões arquiteturais (ADR)

**Comportamento:** Conduz uma entrevista com 7 perguntas antes de propor qualquer coisa. Nunca pula para a implementação sem entender o contexto.

**Skills que usa:** `scaffold-clean-arch`, `contrato-api`

```
Quero arquitetar uma API de notificações em tempo real com alta disponibilidade
```

---

### DevKit Backend

**Especialidade:** APIs REST/GraphQL, regras de negócio, autenticação, integrações. Delega automaticamente para o agente especialista da linguagem identificada: `.NET`, `Node.js`, `Python`, `Go`, `Java` ou `Rust`.

**Quando usar diretamente:**
- Implementar endpoints e lógica de negócio em Node.js, Python, Go ou PHP
- Configurar autenticação/autorização (JWT, OAuth2)
- Integrar com serviços externos

> Quando o usuário mencionar alta performance, baixo uso de memória ou containers leves sem especificar linguagem, o agente sugere Rust proativamente.

**Skills que usa:** `contrato-api` (antes de codar), `revisao-owasp` (obrigatório ao fechar endpoints)

```
Implemente os endpoints de autenticação com JWT e refresh token em Node.js
```

---

### DevKit .NET Backend

**Especialidade:** **.NET 8/9 (C#)** com ASP.NET Core, EF Core e Minimal APIs. Sub-agente do Backend.

**Quando usar diretamente:**
- APIs REST em C# com ASP.NET Core (Minimal API ou Controllers)
- Migrar de versões antigas do .NET (Framework, Core 3.1, .NET 6/7)
- Integração com PostgreSQL via EF Core + Npgsql

**Skills que usa:** `contrato-api`, `revisao-owasp`, `scaffold-clean-arch`

```
Crie uma API REST de gerenciamento de usuários em .NET 8 com ASP.NET Core, EF Core e PostgreSQL
```

---

### DevKit Node.js Backend

**Especialidade:** **Node.js 22 LTS + TypeScript 5.x** com Fastify (padrão) ou NestJS. Sub-agente do Backend.

**Quando usar diretamente:**
- APIs REST com Fastify + Zod + Prisma
- Projetos NestJS enterprise com DI e decorators
- Microserviços TypeScript com `strict: true` e sem `any`

**Skills que usa:** `contrato-api`, `revisao-owasp`, `scaffold-clean-arch`

```
Implemente os endpoints de autenticação com JWT e refresh token usando Fastify e Prisma
```

---

### DevKit Python Backend

**Especialidade:** **Python 3.12/3.13** com FastAPI (padrão) ou Django REST Framework. Sub-agente do Backend.

**Quando usar diretamente:**
- APIs REST em FastAPI com Pydantic v2 e SQLAlchemy 2.x async
- Integração de modelos de ML/AI com API Python
- Projetos Django com admin panel e DRF

**Skills que usa:** `contrato-api`, `revisao-owasp`, `scaffold-clean-arch`

```
Implemente os endpoints de autenticação com JWT e refresh token usando FastAPI e SQLAlchemy
```

---

### DevKit Go Backend

**Especialidade:** **Go 1.22+** com Gin (padrão), Fiber ou net/http nativo. Sub-agente do Backend.

**Quando usar diretamente:**
- Microserviços de alta performance com Go
- Containers com footprint mínimo (imagem distroless)
- APIs com pgx direto e golang-migrate

**Skills que usa:** `contrato-api`, `revisao-owasp`, `scaffold-clean-arch`

```
Crie uma API REST de pedidos em Go com Gin, pgx e golang-migrate
```

---

### DevKit Java Backend

**Especialidade:** Java 21, 23 e 25 com Spring Boot 3.x ou Quarkus. Sub-agente do Backend.

**Quando usar diretamente:**
- Projetos Java explicitamente (pode ser ativado direto ou via orquestrador)
- Migrar de versões anteriores do Java
- Otimizar código Java com Records, Virtual Threads e APIs modernas

**Skills que usa:** `revisao-owasp`, `contrato-api`

```
Crie um serviço de pedidos com Spring Boot 3.x, JPA e validação de estoque
```

---

### DevKit Rust Backend

**Especialidade:** Rust moderno (edição 2021/2024) com **Axum** (padrão) e Actix-web. Sub-agente do Backend.

**Quando usar diretamente:**
- Projetos Rust explicitamente (pode ser ativado direto ou via orquestrador)
- APIs REST/gRPC de alta performance com baixo uso de memória
- Microserviços cloud-native com containers extremamente leves
- Servidores MCP (Model Context Protocol) em Rust

> Rust é a linguagem mais admirada pelo mercado pelo 9º ano consecutivo (82% — SO Developer Survey 2024).

**Skills que usa:** `scaffold-rust-api`, `revisao-owasp`, `contrato-api`

```
Crie uma API REST de autenticação com Axum + SQLx + PostgreSQL
```

---

### DevKit Banco de Dados

**Especialidade:** PostgreSQL como banco relacional padrão. Modelagem, DDL, DQL e tuning.

**Quando usar diretamente:**
- Criar ou alterar schema de banco de dados
- Escrever queries otimizadas
- Criar índices, constraints e migrations

**Convenções aplicadas:** UUID como PK, `TIMESTAMPTZ` em todos os campos de data, constraints nomeadas, trigger automático de `updated_at`, índices `CONCURRENTLY`.

**Output obrigatório:** Ao finalizar qualquer tarefa de modelagem, o agente gera automaticamente um **diagrama ER em Mermaid** salvo em `docs/database/schema-diagram.md` com todas as entidades, relacionamentos e tipos de dados.

**Skills que usa:** `gerar-migration-postgres`

```
Crie o schema de produtos, categorias e variantes com relacionamentos e índices para busca full-text
```

---

### DevKit Frontend

**Especialidade:** React e Next.js com TypeScript, Tailwind CSS, React Query e Zustand.

**Quando usar diretamente:**
- Criar telas e componentes de UI
- Integrar o frontend com a API backend
- Configurar roteamento e estado global

**Comportamento:** Consulta `.github/brand/guide.txt` antes de criar qualquer UI para garantir aderência à identidade visual. Consulta `docs/contracts/` antes de integrar com APIs. Exige output funcional e visível — não entrega componentes sem renderização validada.

**Skills que usa:** `scaffold-react`, `contrato-api`, `tokens-design-react`, `branding-DevKit-react`, `selecao-assets-marca`, `qa-identidade-visual`

```
Crie a tela de listagem e detalhe de produtos com filtros, paginação e skeleton loading
```

---

### DevKit SRE

**Especialidade:** Containerização e Kubernetes por cloud. Suporta AKS, EKS, GKE e OpenShift.

**Quando usar diretamente:**
- Criar ou revisar Dockerfiles
- Gerar manifests Kubernetes (Deployment, Service, Ingress, HPA, etc.)
- Configurar pipelines CI/CD
- Diagnosticar problemas em pods e clusters

**Comportamento:** Conduz entrevista de 7 perguntas para identificar cloud, runtime e requisitos antes de gerar qualquer arquivo.

**Constraints:** Nunca usa `latest` como tag; nunca roda como root; sempre define `resources.limits`; sempre configura liveness e readiness probes.

**Skills que usa:** `scaffold-k8s`, `dockerfile-review`, `pipeline-cicd`, `k8s-troubleshoot`

```
Crie o Dockerfile e os manifests Kubernetes para o deploy da API no AKS com HPA e Ingress
```

```
O pod está em CrashLoopBackOff no namespace production, me ajude a diagnosticar
```

---

### DevKit SRE Investigador

**Especialidade:** Diagnóstico e investigação de problemas em clusters Kubernetes com base em manifests reais e logs. Parte da família SRE.

**Quando usar diretamente:**
- Pod em estado de erro (`CrashLoopBackOff`, `OOMKilled`, `Pending`, `ImagePullBackOff`)
- Ingress retornando 502, 503 ou 404 sem motivo aparente
- Rolling update travado
- Secrets/ConfigMaps não montando (`CreateContainerConfigError`)
- HPA não escalando
- Qualquer comportamento inesperado em produção

**Como usar:** Forneça os artefatos relevantes — o agente pede o que estiver faltando:
```bash
kubectl get deployment {nome} -n {ns} -o yaml
kubectl get svc {nome} -n {ns} -o yaml
kubectl get ingress {nome} -n {ns} -o yaml
kubectl logs {pod} -n {ns} --previous
kubectl describe pod {pod} -n {ns}
```

**Comportamento:** Correlaciona automaticamente selectors entre Deployment → Service → Ingress; analisa exit codes nos logs; identifica mismatch de portas, labels, chaves de Secret e configurações de probe. Entrega sempre: causa raiz com evidência, correção exata e comando de validação.

**Skills que usa:** `k8s-troubleshoot`

```
O pod está em CrashLoopBackOff com exit code 137. Segue o Deployment e os logs:
[cole o YAML e os logs aqui]
```

```
Ingress retorna 503 intermitente no namespace prod. Segue o Service e o Ingress:
[cole os YAMLs aqui]
```

---

### DevKit Cérebro

**Especialidade:** Estado centralizado do projeto e lifecycle hooks. Age como pre-hook (lê contexto, sintetiza briefing) e post-hook (atualiza estado, detecta conflitos, recomenda próximos passos) em todo ciclo de delegação do orquestrador.

**Quando usar diretamente:**
- Consultar o estado atual do projeto ("qual o status do backend?", "há conflitos entre camadas?")
- Saber o próximo passo recomendado com base no que já foi feito
- Auditar consistência entre camadas (tabelas existem no banco? endpoint referenciado no frontend existe no backend?)

**Modos de operação:**
- `PRE_TASK` — lê context.md e gera um Context Brief estruturado para o sub-agente que vai receber a delegação
- `POST_TASK` — atualiza o context.md com log de execução, estado por camada e conflitos detectados
- `QUERY` — responde perguntas diretas sobre o estado do projeto
- `AUDIT` — auditoria de consistência cross-camada

**Constraints:** NÃO implementa código; NÃO delega para outros agentes; SEMPRE preserva o histórico do log.

```
Qual o estado atual do projeto? O que está pendente?
```

```
Há conflitos entre o banco de dados e o backend implementado?
```

---

### DevKit Tester

**Especialidade:** Validação funcional imediata após implementação. Executa testes automatizados, verifica compilação, health checks e realiza troubleshoot quando encontra erros.

**Quando usar diretamente:**
- Após qualquer agente concluir sua implementação
- Quando algo não está funcionando e precisa de diagnóstico rápido
- Antes de fazer commit de qualquer mudança

**Comportamento:** Lê o context bank, identifica a stack em uso, executa os comandos de validação corretos para a linguagem, diagnostica erros com causa raiz e aplica correções pontuais. Retorna `PASS`, `FAIL_FIXABLE` ou `FAIL_BLOCKED` para o orquestrador.

**Integração:** Chamado automaticamente pelo Orquestrador após cada sub-agente concluir e antes de cada commit.

```
O backend foi implementado, teste se está funcionando
```

---

### DevKit Documentação

**Especialidade:** Documentação técnica de impacto — README, ADR, guias de contribuição, referência de API, changelogs.

**Quando usar diretamente:**
- Gerar ou atualizar README de um projeto
- Documentar endpoints e contratos de API
- Registrar decisões arquiteturais

**Comportamento:** Lê o código real antes de escrever qualquer documentação. Não usa emojis decorativos — apenas símbolos funcionais (✅ ❌ ⚠️ 🔒 🚧).

```
Gere o README completo do projeto com setup, variáveis de ambiente e guia de contribuição
```

---

### DevKit Tradutor

**Agente interno — não invocar diretamente.**

Traduz o input do usuário para inglês usando `gpt-4o-mini` antes de qualquer processamento. A tradução é transparente: o usuário never vê o texto traduzido e sempre recebe a resposta no idioma original.

---

## Hierarquia de Agentes

```
DevKit Orquestrador
├── DevKit Tradutor                (interno, sempre primeiro)
├── DevKit Cérebro                 (estado global do projeto e lifecycle hooks)
├── DevKit Arquitetura
├── DevKit Banco de Dados
├── DevKit Backend
│   ├── DevKit .NET Backend        (sub-agente — C#/.NET 8/9)
│   ├── DevKit Node.js Backend     (sub-agente — TypeScript/Node.js 22)
│   ├── DevKit Python Backend      (sub-agente — Python 3.12/3.13)
│   ├── DevKit Go Backend          (sub-agente — Go 1.22+)
│   ├── DevKit Java Backend        (sub-agente — Java 21/23/25)
│   └── DevKit Rust Backend        (sub-agente — Rust 2021/2024)
├── DevKit Frontend
├── DevKit Tester              (validação após cada camada implementada)
├── DevKit SRE
│   └── DevKit SRE Investigador    (investigação de falhas em produção)
└── DevKit Documentação
```

---

## Hooks de Ciclo de Vida

Os hooks são artefatos físicos em `.github/hooks/` — instruções completas executadas pelos agentes em momentos específicos do ciclo de desenvolvimento. Os agentes leem o arquivo do hook correspondente antes de agir.

| Arquivo | Executor | Quando é executado |
|---|---|---|
| [`PRE_TASK.md`](.github/hooks/PRE_TASK.md) | DevKit Cérebro | Antes de qualquer delegação para sub-agente — sintetiza Context Brief com estado do projeto |
| [`POST_IMPLEMENT.md`](.github/hooks/POST_IMPLEMENT.md) | DevKit Tester | Após qualquer implementação — valida por stack e retorna `PASS`, `FAIL_FIXABLE` ou `FAIL_BLOCKED` |
| [`POST_VALIDATE.md`](.github/hooks/POST_VALIDATE.md) | DevKit Cérebro | Após validação bem-sucedida — atualiza context.md e detecta conflitos entre camadas |
| [`POST_SESSION.md`](.github/hooks/POST_SESSION.md) | Orquestrador | Ao encerrar a sessão — executa git workflow com branch, commits, merge e tag semver |

> O protocolo de orquestração (quando e por quê cada hook é ativado) está na skill `lifecycle-hooks`. Os arquivos acima definem **o quê fazer** em cada hook.

---

## Skills Disponíveis

Skills são workflows especializados que os agentes invocam automaticamente. Não é necessário ativá-las manualmente.

| Skill | Agentes que usam | Finalidade |
|---|---|---|
| `traduzir-entrada` | Orquestrador | Traduz input para inglês antes do processamento |
| `lifecycle-hooks` | Orquestrador | Protocolo de quando/por quê cada hook é ativado — as instruções concretas ficam em `.github/hooks/` |
| `decisao-linguagem` | Orquestrador, Backend | Seleciona linguagem backend ideal com matriz de decisão ponderada por criterios objetivos |
| `security-lib-scan` | Todos os backends, Arquitetura | Pesquisa CVEs e reputação de dependências antes de adotar |
| `project-context-bank` | Orquestrador, Cérebro, todos os backends, Arquitetura | Banco de contexto persistente: decisões, falhas, estado por camada, log de execução e histórico de validações |
| `scaffold-clean-arch` | Arquitetura | Gera estrutura de pastas Clean Architecture |
| `contrato-api` | Arquitetura, Backend, Frontend | Define contratos HTTP e interfaces de repositório |
| `revisao-owasp` | Backend, Java Backend, Rust Backend | Checklist OWASP A01–A10 antes de fechar endpoints |
| `gerar-migration-postgres` | Banco de Dados | Templates de migration PostgreSQL com boas práticas |
| `scaffold-react` | Frontend | Setup de projeto React/Next.js com todas as dependências |
| `scaffold-rust-api` | Rust Backend | Estrutura Clean Architecture com Axum + SQLx + PostgreSQL |
| `branding-DevKit-react` | Frontend | Regras de aplicação da identidade visual DevKit em React |
| `selecao-assets-marca` | Frontend | Escolhe logo/símbolo/ícone correto por contexto e tema |
| `tokens-design-react` | Frontend | CSS variables e config Tailwind com tokens da marca |
| `qa-identidade-visual` | Frontend | Checklist de validação visual antes de release |
| `scaffold-k8s` | SRE | Gera manifests Kubernetes completos por cloud |
| `dockerfile-review` | SRE | Revisa Dockerfiles existentes por segurança e performance |
| `pipeline-cicd` | SRE | Gera pipelines CI/CD para AKS, EKS, GKE e OpenShift |
| `k8s-troubleshoot` | SRE, SRE Investigador | Diagnóstico passo a passo para problemas no cluster |
| `ssh-connect` | SRE | Conexão SSH segura por chave (Ed25519/RSA) ou usuário/senha |
| `ansible` | SRE | Automação de infraestrutura com playbooks, roles e Ansible Vault |
| `terraform` | SRE | Infraestrutura como código com módulos, state remoto e pipelines |
| `azurecli` | SRE | Gerenciamento de recursos Azure: AKS, ACR, Key Vault, PostgreSQL |
| `awscli` | SRE | Gerenciamento de recursos AWS: EKS, ECR, S3, Secrets Manager |
| `gcpsdk` | SRE | Gerenciamento de recursos GCP: GKE, Artifact Registry, Secret Manager |
| `githubactions` | SRE, Documentação | Pipelines CI/CD GitHub Actions multi-cloud |
| `git-workflow` | Orquestrador, Documentação | Padrão de commits, branches, merge e tags semver |

---

## Assets de Marca

Os assets de identidade visual ficam em `.github/brand/` e são consumidos automaticamente pelo agente frontend e pelas skills de branding.

```
.github/brand/
├── logos/         → logo-h-on-light.png, logo-h-on-dark.png, logo-v-* ...
├── symbols/       → symbol-on-light.png, symbol-on-dark.png ...
├── icons/light/   → search, alert, user, shield, analytics, donut, target
├── icons/dark/    → mesmos 7 ícones para fundos escuros
├── shapes/        → formas geométricas de apoio (circle, square, rect)
├── fonts/         → Sora-Regular, Bold, SemiBold, ExtraBold (.ttf)
└── guide.txt      → guia de identidade visual + mapa completo da estrutura
```

| Contexto | Asset correto |
|---|---|
| Header fundo claro | `logos/logo-h-on-light.png` |
| Header fundo escuro | `logos/logo-h-on-dark.png` |
| Favicon / avatar | `symbols/symbol-on-light.png` ou `symbol-on-dark.png` |
| Ícone em superfície clara | `icons/light/<nome>.png` |
| Ícone em superfície escura | `icons/dark/<nome>.png` |

Paleta oficial: `#7852EA` (roxo), `#000000`, `#FFFFFF`, cinzas `#E9F2F4` / `#F5F5F5` / `#F4F1FD`.  
Tipografia: **Sora** (ExtraBold → títulos, SemiBold/Bold → subtítulos, Regular → corpo).

---

## Exemplos de Uso

### Aplicação completa

**Agente:** `DevKit Orquestrador`

```
Crie uma plataforma SaaS de gestão de tarefas com:
- Backend em Node.js (Express + TypeScript)
- Frontend em Next.js
- PostgreSQL
- Deploy no EKS com CI/CD pelo GitHub Actions
```

O orquestrador vai: traduzir → **PRE_TASK (Cérebro)** → arquitetar → modelar banco → **POST_IMPLEMENT (Tester)** → **POST_VALIDATE (Cérebro)** → implementar backend → **POST_IMPLEMENT → POST_VALIDATE** → implementar frontend → gerar infra → documentar → **POST_SESSION (git-workflow)**.

---

### Só o banco de dados

**Agente:** `DevKit Banco de Dados` (ou via Orquestrador)

```
Crie o schema para um sistema de e-commerce: produtos, categorias, pedidos, itens de pedido e usuários
```

---

### Revisar um Dockerfile existente

**Agente:** `DevKit SRE`

```
Revise o Dockerfile desta aplicação Python e corrija os problemas de segurança e tamanho
```

---

### Diagnosticar problema no Kubernetes

**Agente:** `DevKit SRE Investigador`

```
O pod da API está em CrashLoopBackOff no namespace production.
Segue o Deployment, o Service e os logs do pod:
[cole os YAMLs e logs aqui]
```

```
Ingress retornando 503 — pods estão Running mas o tráfego não chega.
Segue o Ingress e o Service do namespace staging:
[cole os YAMLs aqui]
```

---

### Gerar pipeline CI/CD

**Agente:** `DevKit SRE`

```
Crie o pipeline GitHub Actions para build e deploy automático da API no GKE com Workload Identity Federation
```

---

### Implementar backend Java

**Agente:** `DevKit Java Backend` (ou via `DevKit Backend`)

```
Implemente o domínio de pedidos com Spring Boot 3.x, usando eventos de domínio e Virtual Threads do Java 21
```

---

### Implementar backend Rust

**Agente:** `DevKit Rust Backend` (ou via `DevKit Backend`)

```
Crie uma API REST de autenticação com Axum + SQLx + PostgreSQL seguindo Clean Architecture
```

---

### Criar interface com identidade visual

**Agente:** `DevKit Frontend`

```
Crie a tela de login com a identidade visual DevKit aplicada corretamente
```

O agente consultará `.github/brand/guide.txt`, escolherá os assets corretos e validará contraste, tipografia e dimensões mínimas antes de entregar.

---

### Documentar o projeto

**Agente:** `DevKit Documentação`

```
Leia o código do repositório e gere o README com setup, arquitetura, endpoints principais e guia de contribuição
```
