---
name: scaffold-k8s
description: "Gera manifests Kubernetes completos (Deployment, Service, Ingress, ConfigMap, Secret, HPA, Namespace) adaptados por plataforma: AKS, EKS, GKE e OpenShift. Use quando: o agente SRE identificou a cloud alvo e precisa gerar os arquivos k8s com as convenções e anotações corretas de cada provider."
user-invocable: true
---

# Scaffold Kubernetes por Cloud

## Quando Usar

- Após o agente SRE identificar a cloud alvo
- Ao criar a infraestrutura de um novo serviço ou aplicação
- Ao adicionar um novo ambiente (dev, staging, prod)

## Procedimento

### Passo 1 — Coletar variáveis

Antes de gerar os arquivos, confirme:

| Variável | Exemplo |
|---|---|
| `APP_NAME` | `my-api` |
| `NAMESPACE` | `dev` / `prod` |
| `IMAGE` | `registry/my-api:1.0.0` |
| `PORT` | `8080` |
| `REPLICAS_MIN` | `2` |
| `REPLICAS_MAX` | `10` |
| `CPU_REQUEST` | `100m` |
| `CPU_LIMIT` | `500m` |
| `MEMORY_REQUEST` | `128Mi` |
| `MEMORY_LIMIT` | `512Mi` |
| `HOST` | `my-api.example.com` |
| `CLOUD` | `aks` / `eks` / `gke` / `openshift` |

### Passo 2 — Gerar `namespace.yaml`

```yaml
# k8s/base/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: {NAMESPACE}
  labels:
    app.kubernetes.io/managed-by: kubectl
    environment: {NAMESPACE}
```

### Passo 3 — Gerar `configmap.yaml`

```yaml
# k8s/base/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {APP_NAME}-config
  namespace: {NAMESPACE}
data:
  APP_ENV: "{NAMESPACE}"
  APP_PORT: "{PORT}"
  LOG_LEVEL: "info"
  # Adicione variáveis não-sensíveis aqui
```

### Passo 4 — Gerar `secret.yaml`

```yaml
# k8s/base/secret.yaml
# ATENÇÃO: Em produção, use External Secrets Operator integrado ao vault da cloud.
# Este arquivo é apenas para desenvolvimento local / referência.
# NUNCA versione secrets com valores reais.
apiVersion: v1
kind: Secret
metadata:
  name: {APP_NAME}-secret
  namespace: {NAMESPACE}
type: Opaque
data:
  # Valores em base64: echo -n "valor" | base64
  DATABASE_URL: "" # preencher via CI/CD ou vault
  JWT_SECRET: ""   # preencher via CI/CD ou vault
```

### Passo 5 — Gerar `deployment.yaml`

**Base (comum a todas as clouds):**

```yaml
# k8s/base/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {APP_NAME}
  namespace: {NAMESPACE}
  labels:
    app: {APP_NAME}
    version: "1.0.0"
spec:
  replicas: {REPLICAS_MIN}
  selector:
    matchLabels:
      app: {APP_NAME}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
  template:
    metadata:
      labels:
        app: {APP_NAME}
    spec:
      serviceAccountName: {APP_NAME}-sa
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
        - name: {APP_NAME}
          image: {IMAGE}
          imagePullPolicy: Always
          ports:
            - containerPort: {PORT}
              name: http
          envFrom:
            - configMapRef:
                name: {APP_NAME}-config
            - secretRef:
                name: {APP_NAME}-secret
          resources:
            requests:
              cpu: "{CPU_REQUEST}"
              memory: "{MEMORY_REQUEST}"
            limits:
              cpu: "{CPU_LIMIT}"
              memory: "{MEMORY_LIMIT}"
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: ["ALL"]
          livenessProbe:
            httpGet:
              path: /health/live
              port: {PORT}
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /health/ready
              port: {PORT}
            initialDelaySeconds: 10
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
          volumeMounts:
            - name: tmp
              mountPath: /tmp
      volumes:
        - name: tmp
          emptyDir: {}
```

**Adição para AKS (Workload Identity):**
```yaml
      serviceAccountName: {APP_NAME}-sa
      # adicionar no spec do pod:
      nodeSelector:
        kubernetes.io/os: linux
```

**Adição para EKS (IRSA):**
```yaml
      serviceAccountName: {APP_NAME}-sa
      # ServiceAccount deve ter anotação com role ARN
```

**Adição para OpenShift (SCC):**
```yaml
      # Remover runAsUser se o SCC for restricted
      # ou usar anyuid SCC se necessário (requer aprovação)
      securityContext:
        runAsNonRoot: true
```

### Passo 6 — Gerar `service.yaml`

```yaml
# k8s/base/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: {APP_NAME}-service
  namespace: {NAMESPACE}
  labels:
    app: {APP_NAME}
spec:
  selector:
    app: {APP_NAME}
  ports:
    - name: http
      port: 80
      targetPort: {PORT}
      protocol: TCP
  type: ClusterIP
```

### Passo 7 — Gerar `ingress.yaml` por cloud

#### AKS — NGINX Ingress Controller
```yaml
# k8s/base/ingress.yaml (AKS)
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {APP_NAME}-ingress
  namespace: {NAMESPACE}
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - {HOST}
      secretName: {APP_NAME}-tls
  rules:
    - host: {HOST}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: {APP_NAME}-service
                port:
                  number: 80
```

#### EKS — AWS Load Balancer Controller
```yaml
# k8s/base/ingress.yaml (EKS)
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {APP_NAME}-ingress
  namespace: {NAMESPACE}
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}]'
    alb.ingress.kubernetes.io/certificate-arn: "{ACM_CERT_ARN}"
    alb.ingress.kubernetes.io/ssl-policy: ELBSecurityPolicy-TLS13-1-2-2021-06
spec:
  rules:
    - host: {HOST}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: {APP_NAME}-service
                port:
                  number: 80
```

#### GKE — GCE Ingress
```yaml
# k8s/base/ingress.yaml (GKE)
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {APP_NAME}-ingress
  namespace: {NAMESPACE}
  annotations:
    kubernetes.io/ingress.class: gce
    kubernetes.io/ingress.global-static-ip-name: "{STATIC_IP_NAME}"
    networking.gke.io/managed-certificates: "{APP_NAME}-cert"
    kubernetes.io/ingress.allow-http: "false"
spec:
  rules:
    - host: {HOST}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: {APP_NAME}-service
                port:
                  number: 80
```

#### OpenShift — Route (substitui Ingress)
```yaml
# k8s/base/route.yaml (OpenShift)
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: {APP_NAME}-route
  namespace: {NAMESPACE}
spec:
  host: {HOST}
  to:
    kind: Service
    name: {APP_NAME}-service
    weight: 100
  port:
    targetPort: http
  tls:
    termination: edge
    insecureEdgeTerminationPolicy: Redirect
  wildcardPolicy: None
```

### Passo 8 — Gerar `hpa.yaml`

```yaml
# k8s/base/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {APP_NAME}-hpa
  namespace: {NAMESPACE}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {APP_NAME}
  minReplicas: {REPLICAS_MIN}
  maxReplicas: {REPLICAS_MAX}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

### Passo 9 — Gerar `serviceaccount.yaml`

```yaml
# k8s/base/serviceaccount.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: {APP_NAME}-sa
  namespace: {NAMESPACE}
  # AKS: adicionar azure.workload.identity/client-id
  # EKS: adicionar eks.amazonaws.com/role-arn
  # GKE: adicionar iam.gke.io/gcp-service-account
  annotations: {}
```

### Passo 10 — Gerar kustomizations

#### `k8s/overlays/dev/kustomization.yaml`
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: dev

resources:
  - ../../base

patches:
  - patch: |-
      - op: replace
        path: /spec/replicas
        value: 1
    target:
      kind: Deployment
      name: {APP_NAME}
```

#### `k8s/overlays/prod/kustomization.yaml`
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: prod

resources:
  - ../../base

patches:
  - patch: |-
      - op: replace
        path: /spec/replicas
        value: {REPLICAS_MIN}
    target:
      kind: Deployment
      name: {APP_NAME}
```

### Comandos de Apply

#### AKS
```bash
az aks get-credentials --resource-group <rg> --name <cluster>
kubectl apply -k k8s/overlays/prod/
```

#### EKS
```bash
aws eks update-kubeconfig --region <region> --name <cluster>
kubectl apply -k k8s/overlays/prod/
```

#### GKE
```bash
gcloud container clusters get-credentials <cluster> --region <region>
kubectl apply -k k8s/overlays/prod/
```

#### OpenShift
```bash
oc login --token=<token> --server=<server>
oc apply -k k8s/overlays/prod/
```

## Output Esperado

- Pasta `k8s/base/` com todos os manifests preenchidos
- Pasta `k8s/overlays/dev/` e `k8s/overlays/prod/`
- Ingress ou Route correto para a cloud identificada
- Anotações cloud-específicas comentadas e documentadas
- Comandos de autenticação e apply prontos para uso
