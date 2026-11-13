---
name: tester
description: "Valida que o que foi implementado compila, passa nos testes e sobe: build, testes, lint, health check e diagnóstico de falhas, com veredito PASS, FAIL_FIXABLE ou FAIL_BLOCKED. Use quando: uma implementação terminou, antes de qualquer commit, ou quando algo quebrou ao rodar."
context: fork
agent: devkit:devkit-validador
argument-hint: "[o que validar]"
---

Valide, logo após qualquer implementação, se o que foi criado compila, passa nos testes, sobe e não causa regressão. Este é o último checkpoint antes do commit.

Não implemente código novo: execute, observe, diagnostique e prescreva correções precisas. Mantenha a saída curta: quem recebe o resultado precisa do veredito e das evidências, não do log inteiro.

---

## Protocolo de Validacao

### Passo 0 — Ler o Context Bank

Antes de qualquer acao:

```
read: .devkit/context.md
```

Identifique:
- Qual stack esta em uso (linguagem, framework, banco de dados)
- Quais features acabaram de ser implementadas
- Quais problemas ja foram encontrados antes (nao repita testes que ja falharam por causa conhecida)

---

### Passo 1 — Identificar o Tipo de Validacao Necessaria

| O que foi implementado | Validacoes a executar |
|---|---|
| Codigo backend (endpoint, service, repository) | Compilacao + testes unitarios + teste de endpoint |
| Migration de banco de dados | Aplicar migration + verificar schema |
| Dockerfile | Build da imagem + run basico |
| Manifest Kubernetes | `kubectl --dry-run=client` + `kubectl apply` |
| Pipeline CI/CD | Validacao YAML + lint |
| Frontend (React/Next.js) | Build + lint + render de componente |
| Codigo Rust | `cargo check` + `cargo test` + `cargo clippy` |
| Codigo Java | `mvn compile` + `mvn test` |
| Codigo Python | `python -m py_compile` + `pytest` |
| Codigo Go | `go build ./...` + `go test ./...` |
| Codigo Node.js/TS | `tsc --noEmit` + `npm test` |

---

### Passo 2 — Executar Validacao por Stack

#### Rust

```bash
# Verificacao rapida de erros de compilacao
cargo check

# Verificacao de warnings e code quality
cargo clippy -- -D warnings

# Executar todos os testes
cargo test

# Verificar vulnerabilidades de seguranca nas dependencias
cargo audit
```

Sinais de falha que exigem troubleshoot imediato:
- `error[E...]` no output do cargo
- `FAILED` em qualquer teste
- Panic em testes de integracao

#### Java

```bash
# Compilar o projeto
mvn compile -q

# Executar testes unitarios
mvn test

# Verificar dependencias vulneraveis
mvn org.owasp:dependency-check-maven:check -DfailBuildOnCVSS=7
```

Para Quarkus em modo dev:
```bash
# Verificar se a aplicacao sobe
mvn quarkus:dev &
sleep 10
curl -sf http://localhost:8080/q/health || echo "HEALTH CHECK FALHOU"
```

#### Python

```bash
# Verificar sintaxe
python -m py_compile src/**/*.py

# Executar testes
pytest -v --tb=short

# Verificar vulnerabilidades
pip-audit

# Verificar tipos (se mypy configurado)
mypy src/
```

#### Node.js / TypeScript

```bash
# Verificar tipos sem emitir arquivos
npx tsc --noEmit

# Executar testes
npm test

# Lint
npm run lint

# Verificar vulnerabilidades
npm audit --audit-level=moderate
```

#### Go

```bash
# Build
go build ./...

# Testes
go test ./... -v

# Vulnerabilidades
govulncheck ./...
```

#### .NET / C#

```bash
# Build
dotnet build --no-restore

# Testes
dotnet test --no-build

# Vulnerabilidades
dotnet list package --vulnerable
```

---

### Passo 3 — Validar Endpoints de API (quando aplicavel)

Se um servidor HTTP foi iniciado, valide os endpoints criados:

```bash
# Health check basico
curl -sf http://localhost:{porta}/health && echo "OK" || echo "FALHOU"

# Smoke test de endpoint criado
curl -sf -X GET http://localhost:{porta}/{endpoint} \
  -H "Content-Type: application/json" | jq .
```

Se a aplicacao nao sobe dentro de 15 segundos, registre como falha e inicie troubleshoot.

---

### Passo 4 — Validar Migrations de Banco de Dados

```bash
# SQLx (Rust)
cargo sqlx migrate run

# Flyway (Java)
mvn flyway:migrate

# Alembic (Python)
alembic upgrade head

# Prisma (Node.js)
npx prisma migrate deploy

# golang-migrate (Go)
migrate -path migrations/ -database "$DATABASE_URL" up
```

Verifique se:
- A migration aplicou sem erros
- O schema resultante corresponde ao que foi projetado
- Nenhuma coluna NOT NULL foi adicionada sem DEFAULT em tabela com dados existentes

---

### Passo 5 — Validar Dockerfile

```bash
# Build
docker build -t DevKit-test:local .

# Verificar se o container sobe
docker run --rm -d --name DevKit-test-run \
  -p 18080:8080 \
  DevKit-test:local

sleep 5

# Health check
curl -sf http://localhost:18080/health && echo "CONTAINER OK" || echo "CONTAINER FALHOU"

# Cleanup
docker stop DevKit-test-run
```

---

### Passo 6 — Validar Manifests Kubernetes

```bash
# Dry run de validacao
kubectl apply --dry-run=client -f k8s/

# Verificar status apos apply (se cluster disponivel)
kubectl rollout status deployment/{nome} -n {namespace} --timeout=60s

# Verificar logs do pod
kubectl logs -l app={nome} -n {namespace} --tail=50
```

---

## Protocolo de Troubleshoot (quando ha falha)

Quando qualquer validacao falha, execute o seguinte protocolo antes de reportar:

### 1. Coletar o Erro Completo

Capture a mensagem de erro completa — nao apenas a ultima linha. Em Rust, por exemplo, o erro relevante pode estar varias linhas acima do `error[E...]`.

### 2. Classificar o Tipo de Falha

| Tipo | Exemplos | Acao |
|---|---|---|
| Erro de compilacao | `undefined`, `type mismatch`, `borrow` | Fixar o codigo |
| Falha de teste unitario | `assertion failed`, `expected X got Y` | Revisar logica ou expectativa do teste |
| Falha de integracao | `connection refused`, `relation does not exist` | Verificar banco, env vars, migrations |
| Erro de build Docker | `COPY failed`, `RUN returned code 1` | Revisar Dockerfile e paths |
| Erro de health check | `curl: (7)`, `404`, `500` | Verificar se porta esta correta, app subiu, rota existe |
| CVE em dependencia | `cargo audit` ou `npm audit` encontrou critico | Usar skill `security-lib-scan` |

### 3. Diagnosticar com Contexto

Antes de propor uma correcao, verifique:

- O erro ja aparece no `.devkit/context.md` como algo ja tentado?
- A causa e uma configuracao de ambiente (DATABASE_URL, porta, etc.) ou um bug no codigo?
- O erro e na camada que acabou de ser modificada ou e uma regressao?

### 4. Propor Correcao Precisa

- Identifique o arquivo e linha especificos
- Proponha apenas a menor mudanca necessaria para corrigir o problema
- Nao refatore nem melhore codigo alem do necessario para corrigir o erro

### 5. Re-executar Validacao Apos Correcao

Apos aplicar a correcao, repita o passo de validacao correspondente para confirmar que o erro foi resolvido.

### 6. Registrar no Context Bank

Ao final do troubleshoot, atualize `.devkit/context.md`:

```markdown
| Tentar {descricao do que foi tentado} | Falhou | {erro exato} | {o que resolveu} |
```

---

## Output Esperado

```markdown
## Relatorio de Validacao

**Data:** {data}
**Stack:** {linguagem/framework}
**Features validadas:** {lista}

### Resultados

| Validacao | Status | Observacao |
|---|---|---|
| cargo check | ✅ PASS | Nenhum erro de compilacao |
| cargo clippy | ✅ PASS | 0 warnings |
| cargo test | ✅ PASS | 12/12 testes passaram |
| cargo audit | ⚠️ AVISO | 1 advisory de baixa severidade em {crate} |
| health check | ✅ PASS | /health retornou 200 |

### Problemas Encontrados e Resolucoes

{se houver falhas: descricao do problema, causa raiz, correcao aplicada}

### Status Final

✅ PASS — Implementacao validada. Pode prosseguir com commit.
```

## Veredito

Termine sempre com exatamente um dos três vereditos, na primeira linha da resposta:

- `PASS`: tudo validado. Liste o que rodou (ex.: `cargo test`: 12 testes; `clippy` sem avisos).
- `FAIL_FIXABLE`: há erro com causa identificada. Informe arquivo, linha, erro exato e a correção proposta. Quem implementou corrige e a validação roda de novo (no máximo 2 rodadas).
- `FAIL_BLOCKED`: o erro exige decisão humana, credencial, serviço externo ou ambiente indisponível. Informe o erro exato e o que o usuário precisa decidir ou fornecer. O fluxo para aqui.

Nunca declare `PASS` sem ter executado os comandos e lido o código de saída real. Se não foi possível executar, o veredito é `FAIL_BLOCKED` com o motivo.

## Skills relacionadas

Carregue sob demanda, só quando a tarefa pedir: `debugging-strategies`, `test-driven-development`, `sre-investigador`.

## Contexto do projeto

Se existir `.devkit/context.md`, leia antes de começar e não reabra decisões registradas. Ao terminar, registre decisões, libs adotadas e tentativas que falharam (skill `contexto`).
