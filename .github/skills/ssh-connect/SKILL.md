---
name: ssh-connect
description: "Guia completo para estabelecer conexões SSH seguras: autenticação por chave (Ed25519/RSA) e por usuário/senha. Cobre geração de par de chaves, configuração do servidor, SSH config file, tunneling, SCP/SFTP e troubleshooting. Use quando: conectar a um servidor remoto, configurar acesso de um pipeline CI/CD, transferir arquivos ou diagnosticar falhas de conexão SSH."
user-invocable: true
---

# SSH Connect — Conexões Seguras

## Método 1 — Autenticação por Chave (recomendado)

### Por que usar chave em vez de senha

| Critério | Chave | Senha |
|---|---|---|
| Segurança | Alta — chave privada nunca trafega na rede | Baixa — suscetível a brute-force |
| Automação | Sem interação humana — ideal para CI/CD | Requer `sshpass` ou expect (frágil) |
| Auditoria | Identidade única por chave | Compartilhamento de senha dificulta rastreio |
| Revogação | Remove a chave pública do servidor | Troca de senha afeta todos que usam |

---

### 1.1 Gerar par de chaves

#### Ed25519 (padrão recomendado — mais seguro e compacto)

```bash
ssh-keygen -t ed25519 -C "seu.email@empresa.com" -f ~/.ssh/id_ed25519
```

#### RSA 4096 (compatibilidade com sistemas legados)

```bash
ssh-keygen -t rsa -b 4096 -C "seu.email@empresa.com" -f ~/.ssh/id_rsa
```

**Parâmetros:**

| Flag | Significado |
|---|---|
| `-t` | Tipo do algoritmo (`ed25519` ou `rsa`) |
| `-b` | Tamanho da chave em bits (RSA: mínimo 4096) |
| `-C` | Comentário — identifica a chave (email ou hostname) |
| `-f` | Caminho do arquivo de saída |

**Resultado:**
```
~/.ssh/id_ed25519      → chave PRIVADA (nunca compartilhe)
~/.ssh/id_ed25519.pub  → chave PÚBLICA (vai para o servidor)
```

> 🔒 Sempre defina uma **passphrase** ao gerar a chave. Use `ssh-agent` para não digitá-la a cada conexão.

---

### 1.2 Copiar a chave pública para o servidor

#### Método automático (ssh-copy-id)

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub usuario@192.168.1.10
```

#### Método manual (quando ssh-copy-id não está disponível)

```bash
# Exibir a chave pública
cat ~/.ssh/id_ed25519.pub

# No servidor, adicionar ao arquivo authorized_keys
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "CONTEUDO_DA_CHAVE_PUBLICA" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

---

### 1.3 Conectar com a chave

```bash
# Conexão básica
ssh -i ~/.ssh/id_ed25519 usuario@192.168.1.10

# Porta personalizada
ssh -i ~/.ssh/id_ed25519 -p 2222 usuario@192.168.1.10

# Com verbose para debug
ssh -v -i ~/.ssh/id_ed25519 usuario@192.168.1.10
```

---

### 1.4 SSH Config File (elimina repetição)

Configure aliases no arquivo `~/.ssh/config` para não repetir flags a cada conexão:

```
# ~/.ssh/config

Host prod-api
    HostName 192.168.1.10
    User deploy
    Port 22
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes

Host staging-db
    HostName 10.0.0.5
    User postgres
    Port 2222
    IdentityFile ~/.ssh/id_ed25519_staging
    IdentitiesOnly yes

Host bastion
    HostName bastion.empresa.com
    User ec2-user
    IdentityFile ~/.ssh/id_ed25519_aws
    ForwardAgent yes

# Saltar pelo bastion para acessar servidor interno
Host servidor-interno
    HostName 10.0.10.20
    User appuser
    ProxyJump bastion
    IdentityFile ~/.ssh/id_ed25519
```

**Uso após configurar:**

```bash
# Antes: ssh -i ~/.ssh/id_ed25519 -p 2222 deploy@192.168.1.10
# Depois:
ssh prod-api

# Acesso via bastion (ProxyJump)
ssh servidor-interno
```

**Permissões obrigatórias do config file:**

```bash
chmod 600 ~/.ssh/config
```

---

### 1.5 SSH Agent (passphrase uma só vez por sessão)

```bash
# Iniciar o agente
eval "$(ssh-agent -s)"

# Adicionar a chave ao agente
ssh-add ~/.ssh/id_ed25519

# Verificar chaves carregadas
ssh-add -l

# Remover todas as chaves do agente
ssh-add -D
```

**Adicionar automaticamente ao shell (`.bashrc` / `.zshrc`):**

```bash
# Iniciar ssh-agent automaticamente se não estiver rodando
if [ -z "$SSH_AUTH_SOCK" ]; then
    eval "$(ssh-agent -s)"
    ssh-add ~/.ssh/id_ed25519 2>/dev/null
fi
```

---

## Método 2 — Autenticação por Usuário e Senha

> ⚠️ Use apenas quando não for possível configurar chaves (acesso temporário, servidor legado sem permissão de administração).

### 2.1 Conexão interativa (padrão)

```bash
ssh usuario@192.168.1.10
# O servidor solicita a senha interativamente
```

```bash
# Porta personalizada
ssh -p 2222 usuario@192.168.1.10
```

---

### 2.2 Conexão não-interativa com senha (automação)

Para automação de scripts ou pipelines onde senha é estritamente necessária, use `sshpass`:

```bash
# Instalar sshpass
# Ubuntu/Debian
sudo apt-get install -y sshpass

# Alpine
apk add --no-cache sshpass

# macOS
brew install sshpass
```

```bash
# Conectar passando senha diretamente (evitar em produção — expõe no histórico)
sshpass -p 'SuaSenha' ssh usuario@192.168.1.10

# ✅ Melhor: senha via variável de ambiente
SSHPASS='SuaSenha' sshpass -e ssh usuario@192.168.1.10

# ✅ Melhor ainda: senha em arquivo com permissão restrita
echo 'SuaSenha' > /tmp/ssh_pass && chmod 600 /tmp/ssh_pass
sshpass -f /tmp/ssh_pass ssh usuario@192.168.1.10
rm -f /tmp/ssh_pass
```

> 🔒 **Nunca** coloque senhas hardcoded em scripts versionados. Use variáveis de ambiente ou um gerenciador de secrets (Vault, AWS Secrets Manager, Azure Key Vault).

---

### 2.3 Executar comando remoto sem abrir sessão interativa

```bash
# Com chave
ssh -i ~/.ssh/id_ed25519 usuario@servidor 'comando aqui'

# Com senha (sshpass)
SSHPASS='senha' sshpass -e ssh usuario@servidor 'systemctl status nginx'

# Múltiplos comandos
ssh usuario@servidor 'cd /app && git pull && systemctl restart api'
```

---

## Transferência de Arquivos

### SCP (cópia simples)

```bash
# Enviar arquivo local para o servidor
scp -i ~/.ssh/id_ed25519 arquivo.tar.gz usuario@servidor:/tmp/

# Baixar arquivo do servidor
scp -i ~/.ssh/id_ed25519 usuario@servidor:/var/log/app.log ./

# Enviar diretório recursivamente
scp -r -i ~/.ssh/id_ed25519 ./dist/ usuario@servidor:/var/www/app/

# Porta personalizada
scp -P 2222 -i ~/.ssh/id_ed25519 arquivo usuario@servidor:/destino/

# Com sshpass (senha)
SSHPASS='senha' sshpass -e scp usuario@servidor:/caminho/arquivo ./
```

### SFTP (sessão interativa de transferência)

```bash
# Iniciar sessão SFTP com chave
sftp -i ~/.ssh/id_ed25519 usuario@servidor

# Comandos dentro do sftp>
sftp> ls                    # listar diretório remoto
sftp> lls                   # listar diretório local
sftp> cd /var/www           # navegar remoto
sftp> lcd ~/downloads       # navegar local
sftp> get arquivo.log       # baixar
sftp> put build.tar.gz      # enviar
sftp> mget *.log            # baixar múltiplos
sftp> bye                   # sair
```

---

## SSH Tunneling

### Encaminhamento de porta local (acessar serviço remoto localmente)

```bash
# Acessar o PostgreSQL do servidor remoto como se fosse local
ssh -L 5433:localhost:5432 -i ~/.ssh/id_ed25519 usuario@servidor -N

# Agora conecte ao banco em localhost:5433
psql -h localhost -p 5433 -U postgres
```

### Encaminhamento de porta remota (expor serviço local no servidor)

```bash
# Expor localhost:3000 como porta 8080 no servidor remoto
ssh -R 8080:localhost:3000 usuario@servidor -N
```

### SOCKS Proxy (rotear tráfego pelo servidor)

```bash
# Criar proxy SOCKS5 na porta 1080 via servidor remoto
ssh -D 1080 usuario@servidor -N -f
```

> Flag `-N`: não executa comando remoto (apenas o túnel).  
> Flag `-f`: executa em background.

---

## Hardening do Servidor SSH

Após ganhar acesso, aplique as seguintes configurações em `/etc/ssh/sshd_config`:

```bash
# Desabilitar login root direto
PermitRootLogin no

# Desabilitar autenticação por senha (após configurar chaves)
PasswordAuthentication no
ChallengeResponseAuthentication no

# Permitir apenas usuários específicos
AllowUsers deploy appuser

# Porta não-padrão (reduz bots automatizados)
Port 2222

# Timeout de sessão ociosa (300s = 5 minutos)
ClientAliveInterval 300
ClientAliveCountMax 2

# Desabilitar X11 forwarding se não usar interface gráfica
X11Forwarding no

# Máximo de tentativas de autenticação
MaxAuthTries 3
```

**Aplicar as mudanças:**

```bash
# Validar sintaxe antes de restartar
sshd -t

# Restartar o serviço
systemctl restart sshd
```

> ⚠️ Sempre mantenha uma sessão SSH ativa enquanto altera o `sshd_config`. Se a config estiver errada, você perde o acesso.

---

## Uso em Pipelines CI/CD

### GitHub Actions

```yaml
- name: Deploy via SSH
  uses: appleboy/ssh-action@v1.0.3
  with:
    host: ${{ secrets.SSH_HOST }}
    username: ${{ secrets.SSH_USER }}
    key: ${{ secrets.SSH_PRIVATE_KEY }}
    port: ${{ secrets.SSH_PORT }}
    script: |
      cd /var/www/app
      git pull origin main
      npm ci --omit=dev
      pm2 restart api
```

### Azure DevOps

```yaml
- task: SSH@0
  inputs:
    sshEndpoint: 'producao-ssh'   # service connection configurada no portal
    runOptions: 'commands'
    commands: |
      cd /var/www/app
      ./deploy.sh
```

### Script Shell genérico (com chave injetada via env)

```bash
#!/usr/bin/env bash
set -euo pipefail

# A chave privada vem de uma variável de ambiente (secret do pipeline)
echo "$SSH_PRIVATE_KEY" > /tmp/deploy_key
chmod 600 /tmp/deploy_key

ssh -i /tmp/deploy_key \
    -o StrictHostKeyChecking=no \
    -o BatchMode=yes \
    "$SSH_USER@$SSH_HOST" \
    "cd /app && ./deploy.sh"

rm -f /tmp/deploy_key
```

> `-o StrictHostKeyChecking=no`: desabilita a confirmação interativa de host desconhecido — use apenas em pipelines onde o host é confiável.  
> `-o BatchMode=yes`: falha imediatamente se senha for solicitada (garante que chave está funcionando).

---

## Troubleshooting

### Diagnóstico rápido

```bash
# Testar conectividade na porta SSH
nc -zv 192.168.1.10 22
telnet 192.168.1.10 22

# Conexão com verbose máximo
ssh -vvv -i ~/.ssh/id_ed25519 usuario@servidor

# Verificar se o agente tem a chave carregada
ssh-add -l

# Testar a chave diretamente
ssh -i ~/.ssh/id_ed25519 -o IdentitiesOnly=yes usuario@servidor
```

### Erros comuns

| Erro | Causa | Solução |
|---|---|---|
| `Permission denied (publickey)` | Chave não está em `authorized_keys` ou permissões erradas | Verificar `~/.ssh/authorized_keys` no servidor; `chmod 600` |
| `Permission denied (password)` | `PasswordAuthentication no` no servidor | Usar chave ou habilitar senha temporariamente |
| `Connection refused` | SSH não está rodando ou porta bloqueada | `systemctl status sshd`; verificar firewall |
| `Host key verification failed` | Servidor mudou de chave (ou ataque MITM) | `ssh-keygen -R <host>` para limpar a entrada antiga |
| `WARNING: UNPROTECTED PRIVATE KEY FILE` | Permissão da chave está errada | `chmod 600 ~/.ssh/id_ed25519` |
| `Too many authentication failures` | muitas chaves tentadas antes da correta | Usar `-o IdentitiesOnly=yes -i <chave>` |
| `ssh_exchange_identification: read: Connection reset` | Firewall ou fail2ban bloqueou o IP | Verificar regras de firewall e /var/log/auth.log |
| `Broken pipe` | Sessão ociosa encerrada pelo servidor | Configurar `ServerAliveInterval 60` no `~/.ssh/config` |

### Verificar permissões no servidor

```bash
# Permissões corretas obrigatórias
ls -la ~/.ssh/
# drwx------ 2 usuario usuario  .ssh/
# -rw------- 1 usuario usuario  .ssh/authorized_keys

# Corrigir se estiver errado
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Verificar logs de autenticação (Debian/Ubuntu)
tail -f /var/log/auth.log | grep ssh

# Verificar logs de autenticação (CentOS/RHEL)
tail -f /var/log/secure | grep ssh

# Verificar se o serviço aceita a chave
sudo sshd -T | grep -i "pubkeyauthentication\|authorizedkeys"
```

---

## Checklist de Acesso Seguro

- [ ] Par de chaves gerado com Ed25519 ou RSA 4096
- [ ] Passphrase definida na chave privada
- [ ] Chave pública copiada para `~/.ssh/authorized_keys` no servidor
- [ ] Permissões `700` no `~/.ssh/` e `600` no `authorized_keys`
- [ ] `PasswordAuthentication no` configurado após validar acesso por chave
- [ ] `PermitRootLogin no` configurado
- [ ] `~/.ssh/config` configurado com alias para evitar repetição de flags
- [ ] Chave privada nunca commitada no repositório (`.gitignore`)
- [ ] Em pipelines: chave armazenada como secret (não como variável de ambiente visível)
