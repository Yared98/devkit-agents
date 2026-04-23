# Hook: POST_IMPLEMENT

Executado pelo `DevKit-tester` **imediatamente após** qualquer agente de implementação concluir.

---

## Quando Executar

- Após `DevKit-banco-dados`, `DevKit-backend` (e qualquer sub-agente de linguagem), `DevKit-frontend` ou `DevKit-sre` concluir
- NUNCA pular — uma camada sem validação bloqueia todas as seguintes
- Executar mesmo que a implementação pareça trivial

---

## O Que Receber do Orquestrador

```
Stack: {linguagem + framework em uso}
O que foi implementado: {descrição + lista de arquivos criados/modificados}
Context Brief: {o mesmo brief do PRE_TASK desta tarefa}
```

---

## O Que Validar por Stack

| Stack | Comandos de validação |
|---|---|
| Rust + Axum | `cargo build`, `cargo test`, `cargo clippy -- -D warnings` |
| Node.js / TypeScript | `npm run build`, `npm test`, `npm run lint` |
| Python / FastAPI | `python -m pytest`, `ruff check .` |
| Go | `go build ./...`, `go test ./...`, `go vet ./...` |
| Java / Spring Boot | `./mvnw test` ou `./gradlew test` |
| Java / Quarkus | `./mvnw quarkus:test` |
| .NET / ASP.NET Core | `dotnet build`, `dotnet test` |
| PostgreSQL (migration) | `sqlx migrate run` ou equivalente da stack |
| Docker | `docker build -t test .` (sem `--no-cache`) |
| Kubernetes (manifests) | `kubectl apply --dry-run=client -f .` |
| React / Next.js | `npm run build`, `npm run lint` |

---

## O Que Produzir

Retorne **exatamente um** dos três resultados abaixo. Não use formatos alternativos.

### PASS

```
[POST_IMPLEMENT] PASS
Validado: {o que foi testado — ex: "cargo test (12 testes), cargo clippy sem warnings"}
```

### FAIL_FIXABLE

```
[POST_IMPLEMENT] FAIL_FIXABLE
Erro: {descrição exata + arquivo + linha, se disponível}
Correção aplicada: {o que foi corrigido}
Resultado após correção: PASS
Validado: {o que foi retestado}
```

### FAIL_BLOCKED

```
[POST_IMPLEMENT] FAIL_BLOCKED
Erro: {descrição exata + arquivo + linha}
Motivo do bloqueio: {por que não é possível corrigir automaticamente}
Ação necessária: {o que o usuário precisa decidir, fornecer ou autorizar}
```

---

## Regras

- Máximo **2 tentativas** de correção automática antes de declarar `FAIL_BLOCKED`
- `FAIL_BLOCKED` **para o fluxo** — o orquestrador deve informar o usuário imediatamente e aguardar instrução
- Não passe para `POST_VALIDATE` se o resultado for `FAIL_BLOCKED`
- Se o Tester não tiver acesso ao ambiente para executar os comandos, declare `FAIL_BLOCKED` com motivo `"ambiente não disponível para execução"`
