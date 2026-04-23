---
name: githubactions
description: "Cria e revisa pipelines CI/CD com GitHub Actions: workflow syntax, jobs, steps, secrets, environments, matrix builds e reusable workflows. Use quando: automatizar build, test e deploy de qualquer aplicação no GitHub, criar pipelines multi-cloud (Azure/AWS/GCP) ou padronizar fluxos de CI/CD."
user-invocable: true
---

# GitHub Actions — Pipelines CI/CD

## Quando Usar

- Automatizar build e testes em pull requests
- Publicar imagens Docker em qualquer container registry (ACR, ECR, Artifact Registry)
- Fazer deploy em AKS, EKS, GKE, OpenShift ou Cloud Run
- Executar Terraform plan/apply em fluxo reviewed
- Criar workflows de release com versionamento semver
- Padronizar workflows reutilizáveis entre repositórios

---

## Estrutura de Arquivos

```
.github/
  workflows/
    ci.yml              → build e testes em PRs
    cd.yml              → deploy em merge na main
    release.yml         → criação de release/tag
    terraform.yml       → plan em PR, apply em merge
  actions/
    build-push/         → action customizada (composite)
      action.yml
```

---

## Conceitos Essenciais

### Anatomia de um Workflow

```yaml
name: CI

on:                          # evento que dispara o workflow
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:         # disparo manual

env:                         # variáveis globais
  NODE_VERSION: "22"

jobs:
  build:                     # ID do job
    name: Build e Testes     # nome exibido na UI
    runs-on: ubuntu-latest   # runner
    timeout-minutes: 15      # limite máximo
    
    strategy:                # matrix build
      matrix:
        node: [20, 22]
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4    # sempre fixar versão

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: npm

      - name: Instalar dependências
        run: npm ci

      - name: Rodar testes
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb
```

---

## Passo 1 — CI (Continuous Integration)

### Pipeline de CI completo

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    name: Lint e Testes
    runs-on: ubuntu-latest
    timeout-minutes: 20

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: testdb
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"

      - name: Instalar dependências
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type Check
        run: npm run type-check

      - name: Testes unitários
        run: npm run test:unit

      - name: Testes de integração
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb

      - name: Coverage
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  build:
    name: Build Docker
    runs-on: ubuntu-latest
    needs: lint-and-test               # só executa se lint-and-test passar

    steps:
      - uses: actions/checkout@v4

      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build (sem push — só para validar)
        uses: docker/build-push-action@v5
        with:
          context: .
          push: false
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

---

## Passo 2 — CD para cada Cloud

### Deploy no AKS (Azure)

```yaml
# .github/workflows/cd-aks.yml
name: CD — AKS

on:
  push:
    branches: [main]

env:
  REGISTRY: acrDevKit.azurecr.io
  IMAGE_NAME: api
  CLUSTER: aks-DevKit-prod
  RESOURCE_GROUP: rg-DevKit-prod
  NAMESPACE: production

jobs:
  build-push:
    name: Build e Push para ACR
    runs-on: ubuntu-latest
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}

    steps:
      - uses: actions/checkout@v4

      - name: Azure Login
        uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Login ACR
        run: az acr login --name acrDevKit

      - name: Metadados da imagem
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,format=short

      - name: Build e Push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    name: Deploy no AKS
    runs-on: ubuntu-latest
    needs: build-push
    environment: production            # exige aprovação manual se configurado

    steps:
      - uses: actions/checkout@v4

      - name: Azure Login
        uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Obter kubeconfig do AKS
        uses: azure/aks-set-context@v4
        with:
          resource-group: ${{ env.RESOURCE_GROUP }}
          cluster-name: ${{ env.CLUSTER }}

      - name: Deploy no Kubernetes
        run: |
          kubectl set image deployment/api \
            api=${{ needs.build-push.outputs.image-tag }} \
            -n ${{ env.NAMESPACE }}
          kubectl rollout status deployment/api \
            -n ${{ env.NAMESPACE }} \
            --timeout=5m
```

### Deploy no EKS (AWS)

```yaml
# .github/workflows/cd-eks.yml
name: CD — EKS

on:
  push:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: DevKit/api
  EKS_CLUSTER: eks-DevKit-prod
  NAMESPACE: production

jobs:
  build-push:
    runs-on: ubuntu-latest
    outputs:
      image: ${{ steps.build.outputs.image }}

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login no ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build, tag e push
        id: build
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

  deploy:
    runs-on: ubuntu-latest
    needs: build-push
    environment: production

    steps:
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Update kubeconfig
        run: aws eks update-kubeconfig --name ${{ env.EKS_CLUSTER }} --region ${{ env.AWS_REGION }}

      - name: Deploy
        run: |
          kubectl set image deployment/api api=${{ needs.build-push.outputs.image }} -n ${{ env.NAMESPACE }}
          kubectl rollout status deployment/api -n ${{ env.NAMESPACE }} --timeout=5m
```

### Deploy no GKE (GCP)

```yaml
# .github/workflows/cd-gke.yml
name: CD — GKE

on:
  push:
    branches: [main]

env:
  PROJECT_ID: DevKit-prod
  REGION: southamerica-east1
  CLUSTER: DevKit-prod
  REGISTRY: southamerica-east1-docker.pkg.dev
  REPOSITORY: DevKit-docker
  IMAGE: api
  NAMESPACE: production

jobs:
  build-push-deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Autenticar no GCP
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - uses: google-github-actions/setup-gcloud@v2

      - name: Configurar Docker para Artifact Registry
        run: gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev --quiet

      - name: Build e Push
        run: |
          IMAGE_PATH=${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/${{ env.IMAGE }}
          docker build -t $IMAGE_PATH:${{ github.sha }} .
          docker push $IMAGE_PATH:${{ github.sha }}

      - name: Get GKE credentials
        uses: google-github-actions/get-gke-credentials@v2
        with:
          cluster_name: ${{ env.CLUSTER }}
          location: ${{ env.REGION }}

      - name: Deploy
        run: |
          IMAGE_PATH=${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/${{ env.IMAGE }}
          kubectl set image deployment/api api=$IMAGE_PATH:${{ github.sha }} -n ${{ env.NAMESPACE }}
          kubectl rollout status deployment/api -n ${{ env.NAMESPACE }} --timeout=5m
```

---

## Passo 3 — Secrets e Environments

```yaml
# Acessar secrets
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  API_KEY: ${{ secrets.API_KEY }}

# Environments — proteção com aprovação
# Configurar em: Settings > Environments > production > Required reviewers
deploy:
  environment:
    name: production
    url: https://api.DevKit.com.br    # URL exibida na UI após deploy
```

### Boas práticas de secrets

```yaml
# ✅ secret como env var
- run: npm run deploy
  env:
    API_KEY: ${{ secrets.API_KEY }}

# ✅ secret mascarado em output (automático se registrado como secret)
- run: echo "Key length: ${#API_KEY}"
  env:
    API_KEY: ${{ secrets.API_KEY }}

# ❌ NUNCA imprima o valor do secret diretamente
- run: echo "${{ secrets.API_KEY }}"    # expõe o valor no log (mesmo mascarado)
```

---

## Passo 4 — Workflows Reutilizáveis

```yaml
# .github/workflows/reusable-build.yml
name: Reusable Build

on:
  workflow_call:
    inputs:
      image-name:
        required: true
        type: string
      registry:
        required: true
        type: string
    secrets:
      registry-password:
        required: true
    outputs:
      image-tag:
        value: ${{ jobs.build.outputs.tag }}

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      tag: ${{ steps.meta.outputs.tags }}
    steps:
      - uses: actions/checkout@v4
      - name: Login no registry
        uses: docker/login-action@v3
        with:
          registry: ${{ inputs.registry }}
          password: ${{ secrets.registry-password }}
          username: _token
      # ... demais steps

# Chamar o workflow reutilizável
jobs:
  build:
    uses: ./.github/workflows/reusable-build.yml
    with:
      image-name: api
      registry: acrDevKit.azurecr.io
    secrets:
      registry-password: ${{ secrets.ACR_PASSWORD }}
```

---

## Patterns Comuns

### Cache de dependências

```yaml
# Node.js
- uses: actions/setup-node@v4
  with:
    node-version: "22"
    cache: "npm"           # automático via package-lock.json

# Python
- uses: actions/setup-python@v5
  with:
    python-version: "3.12"
    cache: "pip"

# Go
- uses: actions/setup-go@v5
  with:
    go-version: "1.22"
    cache: true
```

### Concurrency — cancelar runs antigas

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true   # cancela run anterior do mesmo branch
```

### Matriz de testes

```yaml
strategy:
  fail-fast: false           # continua testando outras versões se uma falhar
  matrix:
    os: [ubuntu-latest, windows-latest]
    node: [20, 22]
    exclude:
      - os: windows-latest
        node: 20             # excluir combinação específica
```

### Rodar apenas em mudanças relevantes

```yaml
on:
  push:
    paths:
      - 'src/**'
      - 'package*.json'
      - '.github/workflows/ci.yml'
    paths-ignore:
      - '**.md'
      - 'docs/**'
```

---

## Anti-Padrões a Evitar

| Anti-padrão | Problema | Solução |
|---|---|---|
| `uses: actions/checkout@main` | Build não reprodutível | Fixar SHA ou versão: `@v4` |
| Secrets em variáveis de ambiente globais | Vazamento entre jobs | Definir no step específico |
| `run: echo ${{ secrets.X }}` | Expõe secret no log | Nunca imprimir secrets direto |
| Deploy sem `environment: production` | Sem aprovação obrigatória | Configurar environnment com reviewers |
| Job único com 30 steps | Difícil depurar, sem paralelismo | Separar em jobs com `needs` |
| Sem `timeout-minutes` | Job pode travar indefinidamente | Sempre definir timeout |
| `if: always()` em deploy | Faz deploy mesmo se build falhou | `if: success()` (padrão) |

---

## Output Esperado

1. Workflow de CI com lint, testes e build Docker validado
2. Workflow de CD com publish para o registry e deploy no cluster
3. Environments configurados com proteção de produção
4. Secrets mapeados sem exposição de valores
5. Concurrency configurado para prevenir deploys paralelos
