---
name: ansible
description: "Cria e revisa automação de infraestrutura com Ansible: playbooks, roles, inventory, handlers, vars e Ansible Vault. Use quando: provisionar servidores, configurar ambientes, automatizar deploys sem Kubernetes, gerenciar configuração de múltiplos hosts."
---

# Ansible — Automação de Infraestrutura

## Quando Usar

- Provisionar servidores Linux/Windows (instalar packages, configurar serviços)
- Gerenciar configuração de múltiplos hosts de forma idempotente
- Automatizar deploys de aplicações em ambientes sem Kubernetes
- Executar tarefas ad-hoc em frota de servidores
- Integrar provisionamento em pipelines CI/CD (GitHub Actions, Azure DevOps)

---

## Pré-requisitos

```bash
# Instalar Ansible (Python 3.10+)
pip install ansible          # via pip
brew install ansible         # macOS

# Verificar versão
ansible --version            # >= 2.15 recomendado

# Instalar coleções necessárias
ansible-galaxy collection install community.general
ansible-galaxy collection install community.docker
ansible-galaxy collection install ansible.posix
```

---

## Estrutura de Projeto Padrão

```
ansible/
  inventory/
    production/
      hosts.yml              → inventário de produção
      group_vars/
        all.yml              → variáveis globais
        webservers.yml       → variáveis do grupo webservers
      host_vars/
        server1.yml          → variáveis específicas do host
    staging/
      hosts.yml
  roles/
    common/                  → utilitários básicos (timezone, packages)
      tasks/main.yml
      handlers/main.yml
      defaults/main.yml
      vars/main.yml
      templates/
      files/
    nginx/
    app/
  playbooks/
    site.yml                 → playbook principal
    deploy.yml               → playbook de deploy
    maintenance.yml
  group_vars/
  ansible.cfg
  requirements.yml           → dependências de roles/collections
```

---

## Passo 1 — Inventário

### Inventário estático (YAML — preferido)

```yaml
# inventory/production/hosts.yml
all:
  children:
    webservers:
      hosts:
        web1:
          ansible_host: 10.0.0.10
          ansible_user: ubuntu
        web2:
          ansible_host: 10.0.0.11
          ansible_user: ubuntu
    dbservers:
      hosts:
        db1:
          ansible_host: 10.0.0.20
          ansible_user: ubuntu
    loadbalancers:
      hosts:
        lb1:
          ansible_host: 10.0.0.5
          ansible_user: ubuntu
```

### Inventário dinâmico (cloud)

```bash
# Azure
ansible-galaxy collection install azure.azcollection
# Arquivo de inventário: azure_rm.yml

# AWS
ansible-galaxy collection install amazon.aws
# Arquivo de inventário: aws_ec2.yml

# Exemplo aws_ec2.yml
plugin: amazon.aws.aws_ec2
regions:
  - us-east-1
filters:
  instance-state-name: running
  tag:Environment: production
keyed_groups:
  - key: tags.Role
    prefix: role
```

---

## Passo 2 — ansible.cfg

```ini
[defaults]
inventory          = inventory/production/hosts.yml
remote_user        = ubuntu
private_key_file   = ~/.ssh/id_ed25519
host_key_checking  = False
retry_files_enabled = False
stdout_callback    = yaml
interpreter_python = auto_silent

[privilege_escalation]
become       = True
become_method = sudo
become_user  = root

[ssh_connection]
pipelining   = True
ssh_args     = -o ControlMaster=auto -o ControlPersist=60s
```

---

## Passo 3 — Playbook

### Estrutura base

```yaml
# playbooks/site.yml
---
- name: Configurar servidores base
  hosts: all
  become: true
  gather_facts: true
  roles:
    - common

- name: Configurar servidores web
  hosts: webservers
  become: true
  roles:
    - nginx
    - app

- name: Configurar banco de dados
  hosts: dbservers
  become: true
  roles:
    - postgresql
```

### Playbook de deploy

```yaml
# playbooks/deploy.yml
---
- name: Deploy da aplicação
  hosts: webservers
  become: true
  serial: 1                    # rolling deploy — 1 host por vez
  max_fail_percentage: 0       # aborta se qualquer host falhar

  vars:
    app_version: "{{ lookup('env', 'APP_VERSION') | default('latest') }}"
    app_dir: /opt/app

  pre_tasks:
    - name: Remover host do load balancer
      community.general.haproxy:
        state: disabled
        host: "{{ inventory_hostname }}"
        socket: /var/run/haproxy/admin.sock

  tasks:
    - name: Fazer pull da nova imagem Docker
      community.docker.docker_image:
        name: "registry.example.com/app:{{ app_version }}"
        source: pull
        force_source: true

    - name: Reiniciar container com nova imagem
      community.docker.docker_container:
        name: app
        image: "registry.example.com/app:{{ app_version }}"
        state: started
        restart: true
        restart_policy: unless-stopped
        env:
          DATABASE_URL: "{{ db_url }}"
        ports:
          - "3000:3000"

    - name: Aguardar aplicação responder
      ansible.builtin.uri:
        url: "http://localhost:3000/health"
        status_code: 200
      retries: 10
      delay: 5
      register: result
      until: result.status == 200

  post_tasks:
    - name: Reincluir host no load balancer
      community.general.haproxy:
        state: enabled
        host: "{{ inventory_hostname }}"
        socket: /var/run/haproxy/admin.sock
```

---

## Passo 4 — Roles

### Estrutura de role

```yaml
# roles/common/tasks/main.yml
---
- name: Atualizar cache de packages
  ansible.builtin.apt:
    update_cache: true
    cache_valid_time: 3600

- name: Instalar packages essenciais
  ansible.builtin.package:
    name: "{{ common_packages }}"
    state: present

- name: Configurar timezone
  community.general.timezone:
    name: "{{ system_timezone }}"
  notify: Reiniciar cron

- name: Criar usuário de deploy
  ansible.builtin.user:
    name: "{{ deploy_user }}"
    shell: /bin/bash
    groups: sudo
    append: true
    create_home: true

- name: Autorizar chave SSH do deploy
  ansible.posix.authorized_key:
    user: "{{ deploy_user }}"
    key: "{{ deploy_public_key }}"
    state: present
```

```yaml
# roles/common/handlers/main.yml
---
- name: Reiniciar cron
  ansible.builtin.service:
    name: cron
    state: restarted

- name: Reiniciar nginx
  ansible.builtin.service:
    name: nginx
    state: reloaded
```

```yaml
# roles/common/defaults/main.yml
---
system_timezone: America/Sao_Paulo
deploy_user: deploy
common_packages:
  - curl
  - wget
  - git
  - unzip
  - htop
  - vim
```

---

## Passo 5 — Variáveis e Ansible Vault

### Hierarquia de variáveis (ordem de precedência — menor para maior)

```
defaults/main.yml        → valores padrão da role
group_vars/all.yml       → todas as máquinas
group_vars/<grupo>.yml   → grupo específico
host_vars/<host>.yml     → host específico
-e "var=value"           → linha de comando (maior precedência)
```

### Criptografia com Ansible Vault

```bash
# Criar arquivo criptografado
ansible-vault create group_vars/production/secrets.yml

# Editar arquivo existente
ansible-vault edit group_vars/production/secrets.yml

# Criptografar apenas um valor
ansible-vault encrypt_string 'senha_super_secreta' --name 'db_password'

# Executar playbook com vault
ansible-playbook site.yml --ask-vault-pass
ansible-playbook site.yml --vault-password-file ~/.vault_pass

# Conteúdo típico do secrets.yml
db_password: !vault |
  $ANSIBLE_VAULT;1.1;AES256
  ...hash criptografado...
db_url: "postgresql://user:{{ db_password }}@db1:5432/mydb"
```

---

## Passo 6 — Comandos Essenciais

```bash
# Verificar conectividade
ansible all -m ping -i inventory/production/hosts.yml

# Executar playbook
ansible-playbook playbooks/site.yml -i inventory/production/hosts.yml

# Dry-run (check mode)
ansible-playbook playbooks/site.yml --check --diff

# Limitar a um host ou grupo
ansible-playbook playbooks/site.yml --limit web1
ansible-playbook playbooks/site.yml --limit webservers

# Executar a partir de uma task específica
ansible-playbook playbooks/site.yml --start-at-task "Configurar nginx"

# Executar apenas tags específicas
ansible-playbook playbooks/site.yml --tags "deploy,restart"

# Task ad-hoc
ansible webservers -m ansible.builtin.shell -a "systemctl status nginx"
ansible all -m ansible.builtin.setup -a "filter=ansible_distribution*"

# Listar tasks de um playbook
ansible-playbook playbooks/site.yml --list-tasks

# Ver hosts que seriam afetados
ansible-playbook playbooks/site.yml --list-hosts

# Instalar dependências de roles/collections
ansible-galaxy install -r requirements.yml
```

---

## Integração com CI/CD

### GitHub Actions

```yaml
- name: Deploy com Ansible
  uses: dawidd6/action-ansible-playbook@v2
  with:
    playbook: playbooks/deploy.yml
    directory: ansible/
    key: ${{ secrets.SSH_PRIVATE_KEY }}
    inventory: |
      [webservers]
      ${{ secrets.SERVER_IP }} ansible_user=ubuntu
    options: |
      --extra-vars "app_version=${{ github.sha }}"
      --vault-password-file /dev/stdin
  env:
    ANSIBLE_VAULT_PASSWORD: ${{ secrets.VAULT_PASSWORD }}
```

---

## Boas Práticas e Anti-Padrões

| Anti-padrão | Problema | Solução |
|---|---|---|
| `shell: apt install nginx` | Não idempotente | `ansible.builtin.package: name: nginx state: present` |
| Senhas em plaintext no inventário | Segurança | Ansible Vault |
| `become: true` global em tudo | Princípio do menor privilégio | Usar `become: true` só onde necessário |
| Ignorar `--check --diff` antes de aplicar | Risco de mudanças inesperadas | Sempre dry-run em produção |
| Role monolítica | Difícil de reutilizar | Roles menores e composíveis |
| `ignore_errors: true` amplo | Oculta falhas reais | Tratar erros explicitamente |

---

## Output Esperado

1. Estrutura de projeto Ansible pronta para uso
2. Inventário configurado para o ambiente alvo
3. Playbook principal e playbook de deploy com rolling strategy
4. Role com tasks, handlers e defaults documentados
5. Comandos de execução e validação (`--check --diff`)
