---
name: pipeline-cicd
description: "Gera pipelines CI/CD completos adaptados ao cloud provider e stack da aplicação. Suporta AKS (Azure DevOps / GitHub Actions + ACR), EKS (GitHub Actions + ECR), GKE (GitHub Actions / Cloud Build + Artifact Registry) e OpenShift (Tekton Pipelines ou GitHub Actions + oc CLI). Use quando: precisar automatizar build, push de imagem e deploy de uma aplicação containerizada."
---

# Geração de Pipeline CI/CD

## Quando Usar

- Ao containerizar uma nova aplicação
- Ao migrar de deploy manual para automatizado
- Ao configurar um novo repositório com CI/CD

## Informações Necessárias (entrevistar se ausentes)

1. Cloud alvo: AKS / EKS / GKE / OpenShift?
2. Registry de imagens: ACR / ECR / Artifact Registry / Quay.io?
3. Ferramenta de deploy: `kubectl apply` / `Helm` / `ArgoCD` / `Flux`?
4. Branch de produção: `main` / `master` / outra?
5. Método de autenticação: OIDC/Workload Identity ou chave de serviço?
6. Há ambientes separados (dev/staging/prod)?

---

## Padrão Universal de Pipeline

Todo pipeline segue as mesmas etapas lógicas, independente da cloud:

```
pull-request → CI (build + test + lint + security scan)
merge em main → CD (build image → tag → push → deploy)
```

**Estratégia de tagging obrigatória:**
- Usar `git sha` (`${GITHUB_SHA::8}`) para rastreabilidade
- Nunca usar `latest` em CD de produção
- Opcional: tag semântica (`v1.2.3`) via Git tags

---

## AKS — Azure (GitHub Actions + ACR + kubectl/Helm)

### Pré-requisitos

```bash
# Criar Service Principal para GitHub Actions (alternativa: Workload Identity Federation)
az ad sp create-for-rbac --name "github-actions-sp" \
  --role contributor \
  --scopes /subscriptions/{SUB_ID}/resourceGroups/{RG}/providers/Microsoft.ContainerRegistry/registries/{ACR_NAME} \
  --sdk-auth

# Adicionar ao GitHub Secrets:
# AZURE_CREDENTIALS  → JSON retornado acima
# ACR_LOGIN_SERVER   → {acr-name}.azurecr.io
# AKS_CLUSTER_NAME
# AKS_RESOURCE_GROUP
```

### `.github/workflows/cd-aks.yml`

```yaml
name: CI/CD — AKS

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ${{ secrets.ACR_LOGIN_SERVER }}
  IMAGE_NAME: minha-app

jobs:
  ci:
    name: Build & Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js   # adaptar por runtime
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install & Test
        run: |
          npm ci
          npm test

      - name: Security Scan (Trivy filesystem)
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          exit-code: '1'
          severity: 'CRITICAL,HIGH'

  cd:
    name: Build Image & Deploy
    runs-on: ubuntu-latest
    needs: ci
    if: github.ref == 'refs/heads/main'
    permissions:
      id-token: write    # necessário para OIDC
      contents: read

    steps:
      - uses: actions/checkout@v4

      - name: Login no Azure
        uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Login no ACR
        run: az acr login --name ${{ secrets.ACR_LOGIN_SERVER }}

      - name: Build e push da imagem
        run: |
          TAG="${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}"
          docker build -t "$TAG" .
          docker push "$TAG"

      - name: Security Scan (Trivy image)
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          exit-code: '1'
          severity: 'CRITICAL'

      - name: Set AKS credentials
        uses: azure/aks-set-context@v4
        with:
          resource-group: ${{ secrets.AKS_RESOURCE_GROUP }}
          cluster-name: ${{ secrets.AKS_CLUSTER_NAME }}

      - name: Deploy com kubectl
        run: |
          kubectl set image deployment/minha-app \
            minha-app=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
            -n production
          kubectl rollout status deployment/minha-app -n production --timeout=120s

      # Alternativa: Deploy com Helm
      # - name: Deploy com Helm
      #   run: |
      #     helm upgrade --install minha-app ./charts/minha-app \
      #       --namespace production \
      #       --set image.repository=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }} \
      #       --set image.tag=${{ github.sha }} \
      #       --wait --timeout 120s
```

---

## EKS — AWS (GitHub Actions + ECR + kubectl)

### Pré-requisitos

```bash
# Recomendado: OIDC com IAM Role (sem long-lived credentials)
# Criar OIDC Provider no IAM para github.com
# Criar IAM Role com trust policy para o repositório
# Adicionar ao GitHub Secrets:
# AWS_ROLE_ARN        → arn:aws:iam::ACCOUNT:role/github-actions-role
# AWS_REGION          → us-east-1
# ECR_REPOSITORY      → minha-app
# EKS_CLUSTER_NAME
```

### `.github/workflows/cd-eks.yml`

```yaml
name: CI/CD — EKS

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  AWS_REGION: ${{ secrets.AWS_REGION }}
  ECR_REPOSITORY: ${{ secrets.ECR_REPOSITORY }}

jobs:
  ci:
    name: Build & Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Test
        run: echo "Adicionar steps de teste aqui"

  cd:
    name: Build Image & Deploy
    runs-on: ubuntu-latest
    needs: ci
    if: github.ref == 'refs/heads/main'
    permissions:
      id-token: write
      contents: read

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login no ECR
        id: ecr-login
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build e push da imagem
        env:
          ECR_REGISTRY: ${{ steps.ecr-login.outputs.registry }}
        run: |
          TAG="$ECR_REGISTRY/$ECR_REPOSITORY:${{ github.sha }}"
          docker build -t "$TAG" .
          docker push "$TAG"
          echo "image=$TAG" >> $GITHUB_OUTPUT
        id: build

      - name: Set EKS credentials
        run: |
          aws eks update-kubeconfig \
            --region ${{ env.AWS_REGION }} \
            --name ${{ secrets.EKS_CLUSTER_NAME }}

      - name: Deploy
        run: |
          kubectl set image deployment/minha-app \
            minha-app=${{ steps.build.outputs.image }} \
            -n production
          kubectl rollout status deployment/minha-app -n production --timeout=120s
```

---

## GKE — Google Cloud (GitHub Actions + Artifact Registry)

### Pré-requisitos

```bash
# Recomendado: Workload Identity Federation (sem JSON key)
# Adicionar ao GitHub Secrets:
# GCP_PROJECT_ID
# GCP_WIF_PROVIDER      → projects/{NUM}/locations/global/workloadIdentityPools/{POOL}/providers/{PROVIDER}
# GCP_SERVICE_ACCOUNT   → github-actions@project.iam.gserviceaccount.com
# GKE_CLUSTER_NAME
# GKE_CLUSTER_LOCATION  → us-central1
# AR_REGISTRY           → us-central1-docker.pkg.dev/{project}/meu-registry
```

### `.github/workflows/cd-gke.yml`

```yaml
name: CI/CD — GKE

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ${{ secrets.AR_REGISTRY }}
  IMAGE_NAME: minha-app

jobs:
  ci:
    name: Build & Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Test
        run: echo "Adicionar steps de teste aqui"

  cd:
    name: Build Image & Deploy
    runs-on: ubuntu-latest
    needs: ci
    if: github.ref == 'refs/heads/main'
    permissions:
      id-token: write
      contents: read

    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to Google Cloud (WIF)
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.GCP_WIF_PROVIDER }}
          service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}

      - name: Setup gcloud
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker para Artifact Registry
        run: gcloud auth configure-docker ${{ secrets.AR_REGISTRY }} --quiet

      - name: Build e push da imagem
        run: |
          TAG="${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}"
          docker build -t "$TAG" .
          docker push "$TAG"

      - name: Set GKE credentials
        uses: google-github-actions/get-gke-credentials@v2
        with:
          cluster_name: ${{ secrets.GKE_CLUSTER_NAME }}
          location: ${{ secrets.GKE_CLUSTER_LOCATION }}

      - name: Deploy
        run: |
          kubectl set image deployment/minha-app \
            minha-app=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
            -n production
          kubectl rollout status deployment/minha-app -n production --timeout=120s
```

---

## OpenShift (Tekton Pipelines + oc CLI)

### Pré-requisitos

```bash
# Criar Service Account com permissão de push no registry interno
oc create serviceaccount pipeline-sa -n meu-namespace
oc policy add-role-to-user edit system:serviceaccount:meu-namespace:pipeline-sa -n meu-namespace

# Instalar Tekton Pipelines se não instalado
oc apply -f https://storage.googleapis.com/tekton-releases/pipeline/latest/release.yaml
```

### `tekton/pipeline.yaml`

```yaml
apiVersion: tekton.dev/v1
kind: Pipeline
metadata:
  name: minha-app-pipeline
  namespace: meu-namespace
spec:
  params:
    - name: git-url
    - name: git-revision
    - name: image-url
    - name: image-tag
  workspaces:
    - name: shared-workspace
    - name: docker-credentials

  tasks:
    - name: clone
      taskRef:
        resolver: cluster
        params:
          - name: kind
            value: task
          - name: name
            value: git-clone
          - name: namespace
            value: tekton-pipelines
      workspaces:
        - name: output
          workspace: shared-workspace
      params:
        - name: url
          value: $(params.git-url)
        - name: revision
          value: $(params.git-revision)

    - name: build-and-push
      runAfter: [clone]
      taskRef:
        resolver: cluster
        params:
          - name: kind
            value: task
          - name: name
            value: buildah
          - name: namespace
            value: tekton-pipelines
      workspaces:
        - name: source
          workspace: shared-workspace
        - name: dockerconfig
          workspace: docker-credentials
      params:
        - name: IMAGE
          value: $(params.image-url):$(params.image-tag)

    - name: deploy
      runAfter: [build-and-push]
      taskSpec:
        steps:
          - name: rollout
            image: quay.io/openshift/origin-cli:latest
            script: |
              oc set image deployment/minha-app \
                minha-app=$(params.image-url):$(params.image-tag) \
                -n meu-namespace
              oc rollout status deployment/minha-app -n meu-namespace
```

### Alternativa: GitHub Actions com `oc` CLI (para OpenShift SaaS/ROSA)

```yaml
- name: Login no OpenShift
  uses: redhat-actions/oc-login@v1
  with:
    openshift_server_url: ${{ secrets.OC_SERVER }}
    openshift_token: ${{ secrets.OC_TOKEN }}

- name: Build e push via oc new-build
  run: |
    oc start-build minha-app --from-dir=. --follow

- name: Deploy
  run: |
    oc set image deployment/minha-app minha-app=image-registry.../$IMAGE:$TAG
    oc rollout status deployment/minha-app
```

---

## Boas Práticas Universais

### Gestão de Secrets

| ❌ Evitar | ✅ Fazer |
|---|---|
| Credenciais como variáveis de ambiente fixas | OIDC / Workload Identity Federation |
| JSON keys de longa duração nos secrets do CI | Roles com escopo mínimo e rotação automática |
| Imprimir vars com `echo` em logs | Mascarar secrets: `echo "::add-mask::$VALUE"` |

### Ambientes Múltiplos (dev/staging/prod)

```yaml
# Usar environments do GitHub para aprovação obrigatória em prod
jobs:
  deploy-prod:
    environment:
      name: production    # requer aprovação manual configurada no repositório
      url: https://app.example.com
```

### Rollback Automático

```bash
# Após deploy, verificar rollout; rollback em caso de falha
kubectl rollout status deployment/minha-app -n production --timeout=120s || \
  kubectl rollout undo deployment/minha-app -n production
```

## Output Esperado

- Arquivo `.github/workflows/cd-{cloud}.yml` pronto para uso
- Lista de secrets necessários com descrição de cada um
- Comando de setup de credenciais (OIDC ou Service Account)
- Instrução para configurar ambientes com aprovação manual (produção)
