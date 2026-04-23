---
name: gcpsdk
description: "Referência e guia de uso do Google Cloud SDK (gcloud) para gerenciar recursos GCP: autenticação, GKE, Artifact Registry, Cloud Run, IAM e Cloud SQL. Use quando: provisionar ou gerenciar recursos GCP via linha de comando, scripts de automação ou pipelines CI/CD."
user-invocable: true
---

# Google Cloud SDK (gcloud) — Gerenciamento de Recursos GCP

## Quando Usar

- Provisionar ou gerenciar recursos GCP sem Terraform (scripts rápidos, bootstrap)
- Autenticar e configurar acesso a clusters GKE
- Empurrar imagens para Google Artifact Registry
- Gerenciar segredos no Secret Manager
- Scripts de automação em Bash para pipelines CI/CD (GitHub Actions, Cloud Build)

---

## Instalação e Configuração

```bash
# Instalar Google Cloud SDK
# Linux
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# macOS
brew install --cask google-cloud-sdk

# Verificar
gcloud version           # >= 470 recomendado

# Inicializar e autenticar
gcloud init              # interativo — define conta, projeto e região

# Autenticação interativa (dev local)
gcloud auth login
gcloud auth application-default login   # para SDKs e bibliotecas cliente

# Autenticação via Service Account (CI/CD)
gcloud auth activate-service-account \
  --key-file=/path/to/service-account.json

# Variável de ambiente para ADC (Application Default Credentials)
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Configurar projeto padrão
gcloud config set project DevKit-prod

# Configurar região e zona padrão
gcloud config set compute/region southamerica-east1
gcloud config set compute/zone southamerica-east1-a

# Ver configuração atual
gcloud config list

# Múltiplas configurações (como profiles)
gcloud config configurations create production
gcloud config configurations activate production
gcloud config configurations list
```

---

## Projetos e IAM

```bash
# Listar projetos
gcloud projects list

# Criar projeto
gcloud projects create DevKit-prod \
  --name="DevKit Production" \
  --labels=environment=production

# Habilitar APIs necessárias
gcloud services enable \
  container.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  sqladmin.googleapis.com \
  cloudresourcemanager.googleapis.com

# Listar APIs habilitadas
gcloud services list --enabled --filter="NAME:container"

# IAM — criar Service Account para CI/CD
gcloud iam service-accounts create sa-cicd-DevKit \
  --display-name="DevKit CI/CD Service Account" \
  --project=DevKit-prod

# Conceder roles ao SA
gcloud projects add-iam-policy-binding DevKit-prod \
  --member="serviceAccount:sa-cicd-DevKit@DevKit-prod.iam.gserviceaccount.com" \
  --role="roles/container.developer"

gcloud projects add-iam-policy-binding DevKit-prod \
  --member="serviceAccount:sa-cicd-DevKit@DevKit-prod.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

# Criar e baixar chave do SA (⚠️ armazenar com segurança)
gcloud iam service-accounts keys create sa-key.json \
  --iam-account=sa-cicd-DevKit@DevKit-prod.iam.gserviceaccount.com

# Listar membros de um role
gcloud projects get-iam-policy DevKit-prod \
  --flatten="bindings[].members" \
  --format="table(bindings.role,bindings.members)" \
  --filter="bindings.members:serviceAccount"
```

---

## GKE — Google Kubernetes Engine

```bash
# Criar cluster GKE (Autopilot — recomendado)
gcloud container clusters create-auto DevKit-prod \
  --region southamerica-east1 \
  --project DevKit-prod

# Criar cluster GKE (Standard — maior controle)
gcloud container clusters create DevKit-prod \
  --zone southamerica-east1-a \
  --num-nodes 3 \
  --machine-type e2-standard-4 \
  --min-nodes 2 \
  --max-nodes 10 \
  --enable-autoscaling \
  --cluster-version 1.29 \
  --enable-ip-alias \
  --workload-pool=DevKit-prod.svc.id.goog \
  --labels environment=production

# Obter kubeconfig
gcloud container clusters get-credentials DevKit-prod \
  --zone southamerica-east1-a \
  --project DevKit-prod

# Listar clusters
gcloud container clusters list

# Atualizar versão do cluster
gcloud container clusters upgrade DevKit-prod \
  --master \
  --cluster-version 1.30 \
  --zone southamerica-east1-a

# Redimensionar node pool
gcloud container clusters resize DevKit-prod \
  --node-pool default-pool \
  --num-nodes 5 \
  --zone southamerica-east1-a

# Deletar cluster
gcloud container clusters delete DevKit-prod \
  --zone southamerica-east1-a \
  --quiet
```

---

## Artifact Registry

```bash
# Criar repositório de containers
gcloud artifacts repositories create DevKit-docker \
  --repository-format=docker \
  --location=southamerica-east1 \
  --description="Imagens Docker DevKit" \
  --project=DevKit-prod

# Configurar Docker para autenticar no Artifact Registry
gcloud auth configure-docker southamerica-east1-docker.pkg.dev

# Build e push
IMAGE="southamerica-east1-docker.pkg.dev/DevKit-prod/DevKit-docker/api"
docker build -t $IMAGE:$GIT_SHA .
docker push $IMAGE:$GIT_SHA
docker tag $IMAGE:$GIT_SHA $IMAGE:latest
docker push $IMAGE:latest

# Listar imagens
gcloud artifacts docker images list \
  southamerica-east1-docker.pkg.dev/DevKit-prod/DevKit-docker \
  --include-tags

# Limpar imagens antigas (manter as 10 mais recentes)
gcloud artifacts docker images delete \
  southamerica-east1-docker.pkg.dev/DevKit-prod/DevKit-docker/api:old-tag \
  --quiet

# Cleanup policy automática
gcloud artifacts repositories set-cleanup-policies DevKit-docker \
  --location=southamerica-east1 \
  --policy=cleanup-policy.json
```

---

## Secret Manager

```bash
# Criar secret
echo -n "senha_super_secreta" | \
  gcloud secrets create db-password \
    --data-file=- \
    --replication-policy=automatic \
    --project=DevKit-prod

# Adicionar nova versão
echo -n "nova_senha" | \
  gcloud secrets versions add db-password --data-file=-

# Ler secret (versão mais recente)
gcloud secrets versions access latest \
  --secret=db-password \
  --project=DevKit-prod

# Ler versão específica
gcloud secrets versions access 3 --secret=db-password

# Listar secrets
gcloud secrets list --project=DevKit-prod

# Listar versões de um secret
gcloud secrets versions list db-password --project=DevKit-prod

# Dar acesso ao SA da aplicação
gcloud secrets add-iam-policy-binding db-password \
  --member="serviceAccount:sa-app@DevKit-prod.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Deletar secret
gcloud secrets delete db-password --quiet
```

---

## Cloud Run

```bash
# Deploy de uma imagem
gcloud run deploy DevKit-api \
  --image southamerica-east1-docker.pkg.dev/DevKit-prod/DevKit-docker/api:latest \
  --platform managed \
  --region southamerica-east1 \
  --port 3000 \
  --min-instances 1 \
  --max-instances 20 \
  --memory 512Mi \
  --cpu 1 \
  --concurrency 80 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production" \
  --set-secrets "DATABASE_URL=db-url:latest" \
  --project DevKit-prod

# Listar serviços
gcloud run services list --region southamerica-east1

# Ver URL do serviço
gcloud run services describe DevKit-api \
  --region southamerica-east1 \
  --format="value(status.url)"

# Ver revisões
gcloud run revisions list --service DevKit-api --region southamerica-east1

# Rollback para revisão anterior
gcloud run services update-traffic DevKit-api \
  --to-revisions=DevKit-api-00005-abc=100 \
  --region southamerica-east1
```

---

## Cloud SQL (PostgreSQL)

```bash
# Criar instância Cloud SQL PostgreSQL
gcloud sql instances create psql-DevKit-prod \
  --database-version=POSTGRES_16 \
  --tier=db-custom-4-16384 \
  --region=southamerica-east1 \
  --availability-type=REGIONAL \
  --backup-start-time=03:00 \
  --enable-bin-log \
  --storage-size=100GB \
  --storage-auto-increase \
  --project=DevKit-prod

# Configurar senha do root
gcloud sql users set-password postgres \
  --instance=psql-DevKit-prod \
  --password="$DB_ROOT_PASSWORD"

# Criar banco de dados
gcloud sql databases create DevKit \
  --instance=psql-DevKit-prod

# Criar usuário da aplicação
gcloud sql users create appuser \
  --instance=psql-DevKit-prod \
  --password="$DB_APP_PASSWORD"

# Conectar via Cloud SQL Proxy
cloud_sql_proxy DevKit-prod:southamerica-east1:psql-DevKit-prod=tcp:5432 &
psql -h 127.0.0.1 -p 5432 -U postgres -d DevKit
```

---

## Integração com CI/CD (GitHub Actions)

```yaml
- name: Autenticar no GCP
  uses: google-github-actions/auth@v2
  with:
    credentials_json: ${{ secrets.GCP_SA_KEY }}

- name: Configurar gcloud
  uses: google-github-actions/setup-gcloud@v2
  with:
    project_id: DevKit-prod

- name: Autenticar Docker no Artifact Registry
  run: gcloud auth configure-docker southamerica-east1-docker.pkg.dev --quiet

- name: Build e Push
  run: |
    docker build -t southamerica-east1-docker.pkg.dev/DevKit-prod/DevKit-docker/api:${{ github.sha }} .
    docker push southamerica-east1-docker.pkg.dev/DevKit-prod/DevKit-docker/api:${{ github.sha }}

- name: Deploy no GKE
  run: |
    gcloud container clusters get-credentials DevKit-prod \
      --zone southamerica-east1-a
    kubectl set image deployment/api api=southamerica-east1-docker.pkg.dev/DevKit-prod/DevKit-docker/api:${{ github.sha }}
```

---

## Output Esperado

1. Projeto GCP configurado com APIs habilitadas
2. Service Account com roles mínimas necessárias (least privilege)
3. Cluster GKE com kubeconfig atualizado
4. Artifact Registry com Docker autenticado
5. Secret Manager com segredos da aplicação e politica de acesso
