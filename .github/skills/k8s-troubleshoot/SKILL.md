---
name: k8s-troubleshoot
description: "Guia de diagnóstico passo a passo para problemas comuns em clusters Kubernetes. Cobre: CrashLoopBackOff, OOMKilled, ImagePullBackOff, pods Pending, rolling update travado, Ingress 502/503/404, secrets não montando, HPA não escalando. Use quando: uma aplicação não está rodando como esperado no cluster."
user-invocable: true
---

# Diagnóstico de Problemas no Kubernetes

## Princípio Geral

Sempre coletar evidências antes de agir. A ordem é:

1. `kubectl get` — estado atual dos recursos
2. `kubectl describe` — eventos e motivo do problema
3. `kubectl logs` — output da aplicação
4. Corrigir com base nos dados, não em suposição

---

## Cheatsheet de Diagnóstico Rápido

```bash
# Namespace com problemas
kubectl get all -n {namespace}

# Pods não Running
kubectl get pods -n {namespace} --field-selector=status.phase!=Running

# Eventos recentes (mais informativos que describe em muitos casos)
kubectl get events -n {namespace} --sort-by='.lastTimestamp'

# Logs do pod atual e anterior
kubectl logs {pod} -n {namespace}
kubectl logs {pod} -n {namespace} --previous

# Detalhes do pod (motivo de crash, limites, volumes)
kubectl describe pod {pod} -n {namespace}

# Consumo de recursos em tempo real
kubectl top pods -n {namespace}
kubectl top nodes
```

---

## CrashLoopBackOff

**Sintoma:** Pod reinicia repetidamente; status `CrashLoopBackOff`

**Diagnóstico:**
```bash
# 1. Ver logs da execução que falhou
kubectl logs {pod} -n {namespace} --previous

# 2. Ver código de saída e razão do crash
kubectl describe pod {pod} -n {namespace} | grep -A 10 "Last State:"
```

**Causas comuns e soluções:**

| Código de Saída | Causa | Ação |
|---|---|---|
| 1 | Erro de aplicação (uncaught exception) | Verificar logs da aplicação |
| 137 | Killed por OOM ou SIGKILL externo | Aumentar `resources.limits.memory` ou verificar liveness probe |
| 139 | Segmentation fault | Bug no binário ou dependência nativa corrompida |
| 143 | SIGTERM não tratado — timeout no shutdown | Implementar graceful shutdown |
| 1 com "permission denied" | Arquivo sem permissão de execução ou volume montado como root | Verificar `securityContext.runAsUser` e permissões do volume |

**Verificação de liveness probe muito agressiva:**
```bash
kubectl describe pod {pod} | grep -A 5 "Liveness:"
# Se "Liveness probe failed" nos eventos → probe está matando o pod antes de ele estar pronto
```

**Correção de probe:**
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30   # dar tempo para a app iniciar
  periodSeconds: 10
  failureThreshold: 3
```

---

## OOMKilled

**Sintoma:** Pod reinicia; `kubectl describe` mostra `OOMKilled`

**Diagnóstico:**
```bash
kubectl describe pod {pod} -n {namespace} | grep -A 5 "OOMKilled\|memory"
kubectl top pod {pod} -n {namespace} --containers
```

**Causas e soluções:**

1. **Limit muito baixo:**
```yaml
# ❌ Limite muito restrito
resources:
  limits:
    memory: "64Mi"

# ✅ Ajustar baseado no uso real
resources:
  requests:
    memory: "128Mi"
  limits:
    memory: "256Mi"
```

2. **Memory leak na aplicação:** escalone horizontal enquanto corrige (não vertical)

3. **JVM sem limite configurado (Java):**
```dockerfile
# ✅ JVM respeitando limit do container
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+UseContainerSupport"
```

---

## ImagePullBackOff / ErrImagePull

**Sintoma:** Pod não inicia; status `ImagePullBackOff`

**Diagnóstico:**
```bash
kubectl describe pod {pod} -n {namespace} | grep -A 5 "Events:"
# Procure: "Failed to pull image", "unauthorized", "not found"
```

**Causas e soluções:**

| Mensagem | Causa | Solução |
|---|---|---|
| `unauthorized` | Sem credencial ou credencial expirada | Verificar `imagePullSecrets` |
| `not found` | Tag ou repositório inexistente | Verificar nome e tag da imagem |
| `network timeout` | Cluster sem acesso ao registry | Verificar NetworkPolicy e DNS |
| `x509 certificate` | Registry com cert auto-assinado | Adicionar CA ao nó ou usar mirror |

**Verificar e corrigir imagePullSecrets:**
```bash
# Listar secrets do tipo docker-registry no namespace
kubectl get secrets -n {namespace} | grep kubernetes.io/dockerconfigjson

# Criar secret de registry (se não existir)
kubectl create secret docker-registry reg-cred \
  --docker-server=myregistry.io \
  --docker-username=usuario \
  --docker-password=senha \
  --docker-email=email@email.com \
  -n {namespace}
```

```yaml
# Referenciar no Deployment
spec:
  imagePullSecrets:
    - name: reg-cred
```

---

## Pods em Pending

**Sintoma:** Pod criado mas não inicia; status `Pending`

**Diagnóstico:**
```bash
kubectl describe pod {pod} -n {namespace} | tail -20
# Procure na seção Events: "Insufficient cpu/memory", "no nodes available"
```

**Causas e soluções:**

| Evento | Causa | Solução |
|---|---|---|
| `Insufficient cpu` | Nenhum nó tem CPU disponível | Adicionar nó ou reduzir `requests.cpu` |
| `Insufficient memory` | Nenhum nó tem memória disponível | Idem para memória |
| `Unschedulable: 0/3 nodes ... taint` | Taint sem toleration | Adicionar `tolerations` no Pod |
| `no persistent volumes available` | PVC não vinculado | Verificar `StorageClass` e capacidade do PV |
| `nodeSelector/affinity not matched` | Nenhum nó satisfaz as regras | Revisar `nodeSelector` ou `affinity` |

**Verificar taints dos nós:**
```bash
kubectl describe nodes | grep -i taint
kubectl get nodes -o json | jq '.items[].spec.taints'
```

**Verificar PVC:**
```bash
kubectl get pvc -n {namespace}
kubectl describe pvc {pvc-name} -n {namespace}
```

---

## Rolling Update Travado

**Sintoma:** `kubectl rollout status` não avança; pods novos não ficam `Running`

**Diagnóstico:**
```bash
kubectl rollout status deployment/{nome} -n {namespace}
kubectl get replicaset -n {namespace}
kubectl describe deployment/{nome} -n {namespace} | grep -A 10 "Conditions:"
```

**Causas e soluções:**

1. **Readiness probe falhando nos pods novos:**
```bash
kubectl describe pod {novo-pod} | grep -A 10 "Readiness"
# Se "Readiness probe failed" → app não está pronta ou probe errada
```

2. **`maxUnavailable: 0` com apenas 1 réplica** — o novo pod precisa iniciar antes do antigo ser removido, mas sem recursos disponíveis:
```yaml
strategy:
  rollingUpdate:
    maxUnavailable: 1
    maxSurge: 1
```

3. **Rollback manual:**
```bash
kubectl rollout undo deployment/{nome} -n {namespace}
kubectl rollout history deployment/{nome} -n {namespace}
kubectl rollout undo deployment/{nome} --to-revision=2 -n {namespace}
```

---

## Ingress 502 / 503 / 404

**Sintoma:** Aplicação no cluster mas retorna erro HTTP ao acessar pelo Ingress

**Diagnóstico:**
```bash
# Verificar se o Service existe e tem Endpoints
kubectl get svc -n {namespace}
kubectl get endpoints {service-name} -n {namespace}

# Verificar se o Ingress está configurado corretamente
kubectl describe ingress {ingress-name} -n {namespace}

# Logs do controller do Ingress (nginx)
kubectl logs -l app.kubernetes.io/name=ingress-nginx -n ingress-nginx --tail=50
```

**Causas e soluções:**

| Status | Causa | Solução |
|---|---|---|
| 404 | regra de path errada no Ingress | Verificar `spec.rules[].http.paths[].path` |
| 502 | pod não está aceitando conexões na porta | Verificar `containerPort` vs `targetPort` no Service |
| 503 | Endpoints vazio (sem pods saudáveis) | Verificar `selector` do Service vs `labels` do Pod |

**Verificar selector do Service vs labels do Pod:**
```bash
# Labels do pod
kubectl get pod {pod} -n {namespace} --show-labels

# Selector do service
kubectl get svc {service} -n {namespace} -o jsonpath='{.spec.selector}'
```

---

## Secrets Não Montando / Variável Ausente

**Sintoma:** Aplicação não encontra variável de ambiente; pod em `CreateContainerConfigError`

**Diagnóstico:**
```bash
kubectl describe pod {pod} -n {namespace} | grep -A 5 "Error\|Warning"
# Comum: "secret not found", "key not found in secret"

# Listar secrets e suas chaves
kubectl get secret {secret-name} -n {namespace} -o jsonpath='{.data}' | jq 'keys'
```

**Causas e soluções:**

1. **Secret no namespace errado:**
```bash
kubectl get secret {secret-name} --all-namespaces
```

2. **Nome da chave errado no `secretKeyRef`:**
```yaml
# O name deve ser exato — case-sensitive
env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: db-secret
        key: password   # verificar se esta chave existe no Secret
```

3. **Secret não criado:**
```bash
kubectl create secret generic db-secret \
  --from-literal=password=minhasenha \
  -n {namespace}
```

---

## HPA Não Escalando

**Sintoma:** Carga alta mas número de réplicas não aumenta

**Diagnóstico:**
```bash
kubectl describe hpa {hpa-name} -n {namespace}
kubectl get hpa -n {namespace}
# Coluna TARGETS mostrará <unknown> se metrics-server não estiver instalado
```

**Causas e soluções:**

| `TARGETS` | Causa | Solução |
|---|---|---|
| `<unknown>/50%` | metrics-server não instalado | Instalar metrics-server |
| `0%/50%` sem escalonamento | `resources.requests` não definido no Pod | Definir `requests.cpu` obrigatório para HPA de CPU |
| Valor correto mas sem escalonamento | `minReplicas` = `maxReplicas` | Ajustar o range |

**Instalar metrics-server (se não presente):**
```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

**Verificar que requests está definido:**
```yaml
resources:
  requests:
    cpu: "100m"    # obrigatório para HPA de CPU funcionar
  limits:
    cpu: "500m"
```

---

## Diagnóstico do Cluster (Visão Geral)

```bash
# Saúde dos nós
kubectl get nodes
kubectl describe node {node-name} | grep -A 10 "Conditions:"

# Recursos disponíveis por nó
kubectl describe nodes | grep -A 10 "Allocated resources:"

# Pods em todos os namespaces com problema
kubectl get pods --all-namespaces | grep -v Running | grep -v Completed

# Eventos do cluster ordenados por tempo
kubectl get events --all-namespaces --sort-by='.lastTimestamp' | tail -30
```

---

## Output Esperado

- Identificação da causa raiz com evidências dos comandos
- Correção aplicada com explicação
- Comando de validação pós-correção (ex: `kubectl rollout status` ou `kubectl get pods -w`)
- Recomendação para evitar o problema futuramente (probe configuration, resource limits, etc.)
