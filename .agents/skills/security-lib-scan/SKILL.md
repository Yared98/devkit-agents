---
name: security-lib-scan
description: "Pesquisa CVEs, vulnerabilidades e reputacao de bibliotecas antes de adota-las. Use quando: escolher uma dependencia nova, auditar dependencias existentes, investigar se uma lib tem historico de problemas de seguranca, encontrar alternativas seguras para uma lib vulneravel."
---

# Security Library Scan

## Quando Usar

- Antes de adicionar qualquer nova dependencia ao projeto
- Ao receber um erro relacionado a uma versao de lib durante build ou runtime
- Quando o usuario citar uma lib e querer saber se e segura
- Durante revisao de `package.json`, `Cargo.toml`, `pom.xml`, `requirements.txt`, `go.mod`, `*.csproj`
- Periodicamente em projetos em producao (recomendado a cada sprint)

---

## Procedimento

### Passo 1 — Identificar o Manifesto de Dependencias

Leia o arquivo de manifesto do projeto:

| Stack | Arquivo |
|---|---|
| Node.js / TypeScript | `package.json`, `package-lock.json` |
| Rust | `Cargo.toml`, `Cargo.lock` |
| Python | `requirements.txt`, `pyproject.toml`, `Pipfile` |
| Java | `pom.xml`, `build.gradle` |
| Go | `go.mod`, `go.sum` |
| .NET | `*.csproj`, `packages.config` |

### Passo 2 — Pesquisar CVEs e Vulnerabilidades

Para cada dependencia em analise, busque nas seguintes fontes usando a tool `search`:

#### Fontes de Pesquisa Prioritarias

1. **OSV Database** (https://osv.dev)
   - Query: `site:osv.dev {nome-da-lib}`
   - Cobre npm, PyPI, crates.io, Maven, Go, NuGet

2. **GitHub Security Advisories** (https://github.com/advisories)
   - Query: `site:github.com/advisories {nome-da-lib}`
   - Inclui GHSA IDs e patches recomendados

3. **Snyk Vulnerability DB** (https://security.snyk.io)
   - Query: `site:security.snyk.io {ecossistema} {nome-da-lib}`
   - Exemplos: `site:security.snyk.io npm express`, `site:security.snyk.io rust actix-web`

4. **CVE Details / NIST NVD**
   - Query: `site:nvd.nist.gov {nome-da-lib} vulnerability`

5. **RustSec (apenas Rust)** (https://rustsec.org/advisories)
   - Query: `site:rustsec.org {nome-da-crate}`

6. **PyPI Safety DB (apenas Python)**
   - Query: `site:pypi.org/project/{nome-da-lib} security`

#### Template de Busca

Para cada lib `{nome}` na versao `{versao}`:

```
search: "{nome} {versao} CVE vulnerability security advisory 2024 2025"
search: "site:osv.dev {nome} {ecossistema}"
search: "site:github.com/advisories {nome}"
```

### Passo 3 — Avaliar Reputacao e Manutencao

Alem de CVEs, avalie a saude da lib:

| Criterio | Sinal de Alerta | Como Verificar |
|---|---|---|
| Ultima atualizacao | > 2 anos sem release | GitHub releases / registry |
| Issues abertas | Muitos bugs criticos sem resposta | github.com/{owner}/{repo}/issues |
| Mantenedores ativos | 0-1 mantenedor sem atividade | github.com/{owner}/{repo}/graphs/contributors |
| Downloads / adocao | Queda brusca no npm/crates.io/PyPI | npmtrends.com, lib.rs, pypistats.org |
| Licenca | GPL em projeto comercial, licenca desconhecida | SPDX no manifesto |

### Passo 4 — Verificar Alternativas Seguras

Se a lib apresentar vulnerabilidades ou sinais de abandono, pesquise alternativas:

```
search: "{caso-de-uso} {linguagem} alternative library secure maintained 2025"
search: "{nome-lib} alternative {ecossistema} 2025"
```

Compare as alternativas por:
- CVE count (historico limpo = melhor)
- Atividade de manutencao (commits recentes)
- Adocao pela comunidade (stars, downloads)
- Compatibilidade com a arquitetura atual

### Passo 5 — Comandos de Auditoria Local

Alem da pesquisa, execute comandos de auditoria no projeto quando possivel:

```bash
# Node.js / npm
npm audit --audit-level=moderate
npx audit-ci --moderate

# Node.js / yarn
yarn audit --level moderate

# Python
pip-audit --requirement requirements.txt
safety check -r requirements.txt

# Rust
cargo audit
cargo deny check advisories

# Java (Maven)
mvn org.owasp:dependency-check-maven:check

# Go
govulncheck ./...

# .NET
dotnet list package --vulnerable
```

---

## Output Esperado

Ao final da varredura, produza um relatorio no seguinte formato:

```markdown
## Relatorio de Seguranca de Dependencias

**Projeto:** {nome}
**Data:** {data-atual}
**Stack:** {linguagem/framework}

### Dependencias Auditadas

| Lib | Versao | CVEs Encontrados | Severidade | Status |
|---|---|---|---|---|
| express | 4.18.2 | Nenhum | — | ✅ Segura |
| lodash | 4.17.19 | CVE-2021-23337 | Alta | ⚠️ Atualizar para 4.17.21 |
| jsonwebtoken | 8.5.1 | CVE-2022-23529 | Critica | ❌ Atualizar urgente para 9.x |

### Acoes Recomendadas

1. **Urgente:** Atualizar `{lib}` de `{versao-atual}` para `{versao-segura}` — CVE-{id} (CVSS {score})
2. **Recomendado:** Substituir `{lib-abandonada}` por `{alternativa}` — sem manutencao desde {ano}
3. **Monitorar:** `{lib}` com bug critico aberto — acompanhar release da correcao

### Libs Reprovadas (nao usar)

| Lib | Motivo | Alternativa Recomendada |
|---|---|---|
| node-serialize | RCE por desserializacao nao segura | Nao ha — evite desserializacao insegura |
| request | Depreciada, 0 manutencao | axios, node-fetch, got |
| crypto-js | CVEs multiplos, nao auditada | WebCrypto API nativa ou noble-crypto |
```

---

## Libs com Historico de Problemas Criticos (Referencia Rapida)

### Node.js / npm
- `event-stream` — backdoor injetado via dependencia transitiva (2018)
- `node-ipc` — sabotagem intencional por mantenedor (2022)
- `colors` / `faker` — sabotagem intencional (2022)
- `node-serialize` — RCE por prototype pollution
- `request` — depreciada, sem correcoes de seguranca

### Python / PyPI
- `ctx` — credenciais AWS exfiltradas (2022)
- `noblox.js-npm` — typosquatting com RAT
- `python-dateutil` < 2.8.1 — ReDoS
- `Pillow` < 9.0.0 — multiplos CVEs de parsing de imagem

### Rust / crates.io
- `ammonia` < 3.1.0 — XSS bypass
- `hyper` < 0.14.10 — HTTP request smuggling
- `openssl` < 0.10.48 — vulnerabilidades do openssl-sys

### Java / Maven
- `log4j` < 2.17.1 — Log4Shell (CVE-2021-44228) CVSS 10.0
- `spring-framework` < 5.3.18 — Spring4Shell (CVE-2022-22965)
- `jackson-databind` < 2.13.1 — multiplos RCE via desserializacao

### .NET / NuGet
- `Newtonsoft.Json` < 13.0.1 — ReDoS
- `System.Text.Encodings.Web` < 4.7.2 — XSS bypass
