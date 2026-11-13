---
name: backend
description: "Ponto de entrada para trabalho de backend quando a linguagem ainda não está definida ou o pedido é genérico: descobre ou decide a stack e encaminha para a skill especialista (Node.js, Python, Go, Java, .NET ou Rust). Use quando: pedirem uma API, serviço ou regra de negócio sem dizer a linguagem, ou perguntarem qual linguagem usar."
---

# Backend (roteador de linguagem)

Esta skill não implementa: ela define a stack e aponta a skill certa. Carregue só a skill da linguagem escolhida, nunca todas.

## 1. Descubra antes de perguntar

1. Leia `.devkit/context.md`: se a linguagem já foi decidida, use-a e não reabra a discussão.
2. Procure o manifesto do projeto:

| Arquivo encontrado | Skill |
|---|---|
| `package.json` com `tsconfig.json` | `backend-node` |
| `pyproject.toml`, `requirements.txt` | `backend-python` |
| `go.mod` | `backend-go` |
| `pom.xml`, `build.gradle` | `backend-java` |
| `*.csproj`, `*.sln` | `backend-dotnet` |
| `Cargo.toml` | `backend-rust` |

## 2. Se não houver nada decidido

Siga o protocolo de [decisao-linguagem.md](decisao-linguagem.md): ele compara as linguagens por requisito (performance, time, ecossistema, prazo) e define o que registrar. Apresente a recomendação com a justificativa em uma frase e confirme com o usuário antes de criar o projeto.

Registre a decisão e as linguagens descartadas em `.devkit/context.md` (skill `contexto`).

## 3. Regras que valem para qualquer linguagem

- Confirme o contrato dos endpoints com a skill `contrato-api` antes de implementar rotas.
- Não crie schema de banco direto no código: use migrations e respeite o modelo da skill `banco-dados`.
- Valide toda entrada nas bordas do sistema. Nunca coloque credenciais ou segredos no código; entregue um `.env.example`.
- Rode a skill `revisao-owasp` antes de considerar concluído qualquer endpoint autenticado ou que receba dados do usuário.
- Antes de adicionar dependência nova, rode `security-lib-scan`.
- Entregue testes dos casos principais e a lista de endpoints (método, caminho, descrição).
