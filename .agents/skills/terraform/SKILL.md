---
name: terraform
description: "Cria e revisa infraestrutura como código com Terraform: providers, recursos, módulos, state, workspaces e pipelines de plan/apply. Use quando: provisionar infra em Azure, AWS ou GCP de forma declarativa, criar módulos reutilizáveis, gerenciar state remoto."
user-invocable: true
---

# Terraform — Infraestrutura como Código

## Quando Usar

- Provisionar e gerenciar infraestrutura em Azure, AWS ou GCP de forma declarativa
- Criar módulos reutilizáveis para recursos recorrentes (VNet, AKS, RDS, etc.)
- Gerenciar múltiplos ambientes (dev, staging, prod) com workspaces ou estrutura de diretórios
- Integrar provisionamento em pipelines CI/CD
- Migrar de provisionamento manual para IaC

---

## Instalação e Configuração

```bash
# Instalar Terraform
# Linux (apt)
wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform

# macOS
brew install terraform

# Verificar
terraform version         # >= 1.7 recomendado

# opcional — gerenciador de versões
brew install tfenv
tfenv install 1.8.0
tfenv use 1.8.0
```

---

## Estrutura de Projeto

### Por ambiente (recomendado para equipes pequenas)

```
infra/
  modules/
    networking/              → VNet, subnets, security groups
      main.tf
      variables.tf
      outputs.tf
    kubernetes/              → AKS / EKS / GKE cluster
    database/                → PostgreSQL gerenciado
    registry/                → ACR / ECR / Artifact Registry
  environments/
    dev/
      main.tf                → chama os módulos
      variables.tf
      terraform.tfvars       → valores de dev (NÃO commitar secrets)
      backend.tf             → configuração do state remoto
    staging/
    production/
```

### Configuração base de um ambiente

```hcl
# environments/production/backend.tf
terraform {
  backend "azurerm" {
    resource_group_name  = "rg-tfstate"
    storage_account_name = "stterraformstate"
    container_name       = "tfstate"
    key                  = "production.terraform.tfstate"
  }
}
```

```hcl
# environments/production/main.tf
terraform {
  required_version = ">= 1.7.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.100"
    }
  }
}

provider "azurerm" {
  features {}
}

module "networking" {
  source              = "../../modules/networking"
  resource_group_name = var.resource_group_name
  location            = var.location
  vnet_address_space  = ["10.0.0.0/16"]
  subnet_cidrs        = {
    aks = "10.0.1.0/24"
    db  = "10.0.2.0/24"
  }
}

module "kubernetes" {
  source              = "../../modules/kubernetes"
  resource_group_name = var.resource_group_name
  location            = var.location
  cluster_name        = "aks-DevKit-prod"
  kubernetes_version  = "1.29"
  node_count          = 3
  vm_size             = "Standard_D4s_v3"
  subnet_id           = module.networking.aks_subnet_id
  depends_on          = [module.networking]
}
```

---

## Passo 1 — Módulos

### Estrutura de módulo reutilizável

```hcl
# modules/kubernetes/main.tf
resource "azurerm_kubernetes_cluster" "this" {
  name                = var.cluster_name
  location            = var.location
  resource_group_name = var.resource_group_name
  dns_prefix          = var.cluster_name
  kubernetes_version  = var.kubernetes_version

  default_node_pool {
    name                = "system"
    node_count          = var.node_count
    vm_size             = var.vm_size
    vnet_subnet_id      = var.subnet_id
    os_disk_size_gb     = 128
    type                = "VirtualMachineScaleSets"
    min_count           = var.min_node_count
    max_count           = var.max_node_count
    enable_auto_scaling = true
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin    = "azure"
    load_balancer_sku = "standard"
  }

  tags = var.tags
}
```

```hcl
# modules/kubernetes/variables.tf
variable "cluster_name" {
  description = "Nome do cluster AKS"
  type        = string
}

variable "location" {
  description = "Região Azure"
  type        = string
}

variable "resource_group_name" {
  description = "Resource group do cluster"
  type        = string
}

variable "kubernetes_version" {
  description = "Versão do Kubernetes"
  type        = string
  default     = "1.29"
}

variable "node_count" {
  description = "Número inicial de nós"
  type        = number
  default     = 2

  validation {
    condition     = var.node_count >= 1 && var.node_count <= 100
    error_message = "node_count deve estar entre 1 e 100."
  }
}

variable "min_node_count" {
  type    = number
  default = 2
}

variable "max_node_count" {
  type    = number
  default = 10
}

variable "vm_size" {
  type    = string
  default = "Standard_D4s_v3"
}

variable "subnet_id" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
```

```hcl
# modules/kubernetes/outputs.tf
output "cluster_id" {
  description = "ID do cluster AKS"
  value       = azurerm_kubernetes_cluster.this.id
}

output "cluster_name" {
  description = "Nome do cluster"
  value       = azurerm_kubernetes_cluster.this.name
}

output "kube_config" {
  description = "Kubeconfig do cluster"
  value       = azurerm_kubernetes_cluster.this.kube_config_raw
  sensitive   = true
}

output "kubelet_identity_object_id" {
  value = azurerm_kubernetes_cluster.this.kubelet_identity[0].object_id
}
```

---

## Passo 2 — State Remoto

### Azure (azurerm backend)

```bash
# Criar storage account para state (uma vez)
az group create --name rg-tfstate --location brazilsouth
az storage account create \
  --name stterraformstate \
  --resource-group rg-tfstate \
  --sku Standard_LRS \
  --min-tls-version TLS1_2 \
  --allow-blob-public-access false

az storage container create \
  --name tfstate \
  --account-name stterraformstate
```

### AWS (s3 backend)

```hcl
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"   # evita concurrent applies
  }
}
```

### GCP (gcs backend)

```hcl
terraform {
  backend "gcs" {
    bucket = "my-terraform-state"
    prefix = "production"
  }
}
```

---

## Passo 3 — Variáveis Sensíveis

```bash
# NUNCA commitar terraform.tfvars com secrets
# Use variáveis de ambiente com prefixo TF_VAR_
export TF_VAR_db_password="senha_super_secreta"
export TF_VAR_client_secret="segredo_azure_app"

# Ou arquivo .tfvars fora do repo
terraform apply -var-file="/secure/production.tfvars"
```

```hcl
# Declarar como sensitive para ocultar no output
variable "db_password" {
  description = "Senha do banco de dados"
  type        = string
  sensitive   = true
}
```

---

## Passo 4 — Comandos Essenciais

```bash
# Inicializar (download providers + backend)
terraform init
terraform init -upgrade          # atualizar providers

# Formatar código
terraform fmt -recursive

# Validar sintaxe
terraform validate

# Planejar mudanças
terraform plan
terraform plan -out=tfplan       # salvar plano para apply posterior

# Aplicar
terraform apply
terraform apply tfplan           # apply do plano salvo
terraform apply -auto-approve    # ⚠️ sem confirmação — usar só em CI/CD

# Destruir (⚠️ irreversível — pede confirmação)
terraform destroy
terraform destroy -target=module.kubernetes   # destruir recurso específico

# Ver state
terraform state list
terraform state show azurerm_kubernetes_cluster.this
terraform output                 # ver outputs
terraform output -json           # outputs em JSON

# Import recurso existente
terraform import azurerm_resource_group.main /subscriptions/.../resourceGroups/meu-rg

# Remover do state sem destruir
terraform state rm azurerm_kubernetes_cluster.this

# Mover recurso no state
terraform state mv module.old_name module.new_name

# Workspaces (alternativa a diretórios por ambiente)
terraform workspace new staging
terraform workspace select production
terraform workspace list
```

---

## Integração com CI/CD

### GitHub Actions — Plan em PR

```yaml
name: Terraform Plan

on:
  pull_request:
    paths:
      - 'infra/**'

jobs:
  terraform:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: infra/environments/production

    steps:
      - uses: actions/checkout@v4

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: "1.8.0"

      - name: Azure Login
        uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Terraform Init
        run: terraform init

      - name: Terraform Format Check
        run: terraform fmt -check -recursive

      - name: Terraform Validate
        run: terraform validate

      - name: Terraform Plan
        id: plan
        run: terraform plan -no-color -out=tfplan
        env:
          TF_VAR_db_password: ${{ secrets.DB_PASSWORD }}

      - name: Comentar Plan no PR
        uses: actions/github-script@v7
        with:
          script: |
            const output = `#### Terraform Plan 📋\n\`\`\`\n${{ steps.plan.outputs.stdout }}\n\`\`\``;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: output
            })
```

---

## Boas Práticas e Anti-Padrões

| Anti-padrão | Problema | Solução |
|---|---|---|
| State em arquivo local | Sem locking, risco de corrupção | State remoto (azurerm/s3/gcs) |
| Tudo em um único `main.tf` enorme | Difícil manutenção | Módulos por recurso |
| `terraform apply -auto-approve` manual | Sem revisão de mudanças | Sempre `plan` antes |
| Secrets no `terraform.tfvars` commitado | Exposição de credenciais | `TF_VAR_` env ou vault |
| Versão de provider sem pin (`~=`) | Build não-reprodutível | `~> 3.100` com minor fixo |
| `count` para recursos distintos | Dificulta refatoração | Prefira `for_each` com map |
| Ignorar `terraform fmt` | Conflitos de PR por formatação | Sempre `fmt -recursive` |

---

## Output Esperado

1. Estrutura de diretórios por ambiente (`dev`, `staging`, `production`)
2. Módulos reutilizáveis com `variables.tf` e `outputs.tf` documentados
3. Backend de state remoto configurado com locking
4. Pipeline CI/CD com `plan` em PR e `apply` em merge
5. Variáveis sensíveis isoladas (sem secrets no repositório)
