# DevKit — skills, subagents e hooks para desenvolvimento full stack

Um conjunto único de skills, subagents e hooks que funciona em **Claude Code**, **Cursor** e **Antigravity**. O modelo principal planeja e integra; subagents em modelo barato exploram o projeto, rodam os testes e escrevem a documentação; hooks cuidam do que não deve depender de o modelo lembrar.

> **Origem:** derivado de [edgesearchlabs/agentes-development](https://github.com/edgesearchlabs/agentes-development) (privado), adaptado de forma independente, sem a identidade visual proprietária.

## Instalação em um projeto

Requer Node.js 18 ou mais novo (usado pelos hooks e pelos scripts).

```bash
git clone https://github.com/Yared98/devkit-agents
```

```bash
node devkit-agents/scripts/install.mjs caminho/do/projeto
```

Para instalar só para algumas ferramentas, acrescente `--tools claude,cursor` (valores: `claude`, `cursor`, `antigravity`). O instalador nunca sobrescreve `AGENTS.md`, `CLAUDE.md`, `.devkit/*` nem arquivos de hooks que já existam, a menos que você passe `--force`.

### Alternativa no Cursor: plugin

O repositório também é um marketplace de plugins do Cursor (`.cursor-plugin/marketplace.json`), com o plugin `devkit` em `plugins/devkit/` (skills, subagents e hooks). Instale em Customize → Install a partir do repositório no GitHub, por projeto ou para o seu usuário, ou copie `plugins/devkit` para `~/.cursor/plugins/local/devkit` e recarregue a janela para testar localmente.

Use o plugin **ou** o instalador no mesmo projeto, não os dois: com ambos, os hooks rodam em dobro e as skills podem aparecer duplicadas. O plugin não cria `AGENTS.md` nem `.devkit/`; crie o Context Bank pedindo a skill `contexto`.

Depois, edite `.devkit/config.md` (stack e convenções) e `.devkit/brand.md` (identidade visual) e, na ferramenta, peça `/orquestrador <o que construir>`.

## O que cada ferramenta lê

| Recurso | Claude Code | Cursor | Antigravity |
|---|---|---|---|
| Instruções | `CLAUDE.md` (importa `AGENTS.md`) | `AGENTS.md` | `AGENTS.md` |
| Skills | `.claude/skills/` | `.agents/skills/` | `.agents/skills/` |
| Subagents | `.claude/agents/` | `.cursor/agents/` | `.agents/agents/` (App e CLI) |
| Hooks | `.claude/settings.json` | `.cursor/hooks.json` | `.agents/hooks.json` |
| Modelo barato | `haiku` | ID definido em `kit/models.json` | `flash` |
| Invocar skill | `/nome` ou automático | `/nome`, `@nome` ou automático | `/nome` ou automático |

As skills são escritas uma vez em `.agents/skills/` (formato Agent Skills padrão). Os subagents são escritos uma vez em `kit/agents/` e o `scripts/sync.mjs` gera o frontmatter de cada ferramenta.

## Skills

**Fluxo e camadas**

| Skill | Para quê |
|---|---|
| `orquestrador` | Entrega que atravessa camadas: planeja, delega, valida cada camada |
| `contexto` | Context Bank em `.devkit/context.md`: estado, decisões, o que não repetir |
| `arquitetura` | Entrevista de requisitos, padrão arquitetural, stack, ADRs |
| `banco-dados` | Modelagem PostgreSQL, migrations, diagrama ER |
| `backend` | Descobre ou decide a linguagem e aponta a skill especialista |
| `backend-node`, `backend-python`, `backend-go`, `backend-java`, `backend-dotnet`, `backend-rust` | Padrões, bibliotecas e estrutura de cada stack |
| `frontend`, `frontend-blazor`, `frontend-mvc` | React/Next.js, Blazor WASM, ASP.NET Core MVC |
| `sre` | Dockerfile, manifests Kubernetes (AKS, EKS, GKE, OpenShift), CI/CD |
| `sre-investigador` | Causa raiz de falhas em cluster a partir de manifests e logs |
| `tester` | Build, testes, lint e veredito `PASS`, `FAIL_FIXABLE` ou `FAIL_BLOCKED` |
| `docs` | README, ADR, CHANGELOG, guias |

**Tarefas pontuais**

`contrato-api`, `gerar-migration-postgres`, `scaffold-clean-arch`, `scaffold-react`, `scaffold-rust-api`, `scaffold-k8s`, `dockerfile-review`, `pipeline-cicd`, `githubactions`, `terraform`, `ansible`, `revisao-owasp`, `security-lib-scan`, `git-workflow`, `identidade-visual`.

**Referência**

`api-design-principles`, `architecture-decision-records`, `database-design`, `frontend-design`, `test-driven-development`, `debugging-strategies`.

Um dev full stack usa `orquestrador` e deixa as demais serem carregadas sob demanda. Um especialista chama direto a skill da sua camada (por exemplo `/backend-go` ou `/sre-investigador`), sem passar pelo fluxo inteiro.

## Subagents

| Subagent | Modelo | Acesso | Papel |
|---|---|---|---|
| `devkit-explorador` | barato | leitura e comandos | Mapeia o projeto e devolve um resumo de até 40 linhas |
| `devkit-validador` | barato | leitura e comandos | Roda build, testes e lint; devolve veredito e evidências |
| `devkit-documentador` | barato | escrita | Atualiza a documentação a partir do código |
| `devkit-implementador` | intermediário | escrita | Implementa uma camada carregando a skill da stack |
| `devkit-revisor` | intermediário | leitura e comandos | Revisa diff: regra de negócio, OWASP, testes fracos |

O ganho vem de dois lados: o trabalho volumoso (ler dezenas de arquivos, logs de teste) fica fora do contexto do modelo principal, e roda em um modelo mais barato. No Claude Code, `/tester` já roda dentro do `devkit-validador` (`context: fork`).

Para trocar os modelos, edite `kit/models.json` e rode `node scripts/sync.mjs`.

## Hooks

Um único script, `.agents/hooks/devkit-hook.mjs`, atende as três ferramentas:

| Momento | O que faz |
|---|---|
| Início da sessão | Injeta `.devkit/context.md` no contexto (até 8.000 caracteres) |
| Antes de comando de terminal | Pede confirmação para comandos destrutivos: `git push --force`, `git reset --hard`, `git clean -f`, `rm -rf` em raiz/home/`.git`, `DROP DATABASE`, `terraform destroy`, entre outros |
| Depois de editar arquivo (e, no Cursor, ao fim de cada subagent) | Anota os arquivos de código alterados em `.devkit/.session.json` |
| Fim do turno | Se houve código alterado e o Context Bank não foi atualizado, lembra uma única vez por sessão de validar e registrar |

Os hooks rodam localmente, como um processo Node comum: nenhum modelo participa e não há gasto de tokens na execução (só o conteúdo do Context Bank injetado entra no contexto). Node foi escolhido por ser o único interpretador que permite um script e uma configuração iguais em Windows, macOS e Linux.

Os hooks só agem quando o projeto tem `.devkit/context.md` (exceto a guarda de comandos, sempre ativa) e falham abertos: com erro, a ferramenta segue normalmente. Sem Node instalado eles simplesmente não agem, sem aviso; confira com `node --version`.

## Estrutura do repositório

```text
.agents/skills/       skills (fonte de verdade; Cursor e Antigravity leem daqui)
.agents/hooks/        script de hooks compartilhado
kit/agents/           subagents (fonte de verdade)
kit/models.json       modelo de cada tier por ferramenta
kit/templates/        AGENTS.md, config.md e brand.md instalados nos projetos
kit/cursor-plugin/    manifesto e hooks do plugin do Cursor
plugins/devkit/       plugin do Cursor (gerado)
scripts/sync.mjs      gera .claude/skills, .claude/agents, .cursor/agents, .agents/agents, plugins/devkit
scripts/install.mjs   instala o kit em outro projeto
```

Depois de editar uma skill ou um subagent:

```bash
node scripts/sync.mjs
```

```bash
node scripts/sync.mjs --check
```

## Pontos a conferir na sua instalação

- **Modelo barato no Cursor:** o Cursor aceita `inherit` ou um ID de modelo. `kit/models.json` usa `claude-haiku-5-5`, que não foi confirmado; liste os IDs com `agent models` (CLI do Cursor) e ajuste se for diferente.
- **Plugin do Cursor:** o layout segue a referência oficial, mas não foi testado em um Cursor real. Dois pontos que a documentação não esclarece: se subagents de plugin respeitam o campo `model`, e se `${CURSOR_PLUGIN_ROOT}` é expandido nos comandos de hook no Windows.
- **Skills duplicadas no Cursor:** o Cursor também lê `.claude/skills/`. Se as skills aparecerem em dobro, instale com `--tools cursor,antigravity` nos projetos em que não usa o Claude Code, ou desligue a opção de configurações de terceiros no Cursor.
- **Hooks no Antigravity:** a documentação não informa o diretório de trabalho dos hooks; a configuração assume a raiz do workspace. Confira com `/hooks` na CLI.
- **Subagents no Antigravity IDE:** a documentação lista subagents só para o App e a CLI (`agy`). No IDE, as skills funcionam e o orquestrador executa os papéis em linha.

Veja o [CHANGELOG](CHANGELOG.md) para o histórico e a lista do que foi removido na versão 2.0.
