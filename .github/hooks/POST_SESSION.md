# Hook: POST_SESSION

Executado pelo orquestrador ao encerrar o ciclo de trabalho da sessão.

---

## Quando Executar

- Usuário sinaliza encerramento: "pode commitar", "pronto", "terminar", "fechar sessão", "commita tudo", "finaliza"
- Todas as camadas planejadas estão com status `✅ Concluído` no `## Estado por Camada` do context.md
- Não executar se houver `FAIL_BLOCKED` não resolvido ou `[CONFLITO]` aberto em `## Perguntas em Aberto`

---

## Passo 1 — Consulte o estado final

Invoque `DevKit-cerebro` em modo `QUERY`:

```
Modo: QUERY
Pergunta: Liste todas as camadas concluídas, arquivos criados e decisões tomadas nesta sessão. Há pendências ou conflitos em aberto?
```

Se houver pendências ou conflitos: informe o usuário antes de prosseguir.

```
[POST_SESSION] Há itens em aberto antes de commitar:
- [CONFLITO] {descrição}
- [PENDÊNCIA] {descrição}
Deseja commitar mesmo assim ou resolver primeiro?
```

---

## Passo 2 — Execute a skill `git-workflow`

Com base no output do Cérebro, gere:

### Branch
- `feat/{escopo}` para novos recursos
- `fix/{escopo}` para correções

### Commits (1 por arquivo ou grupo lógico)

```
feat(banco): criar migration {n}_{nome}.sql com tabela {nome}
feat(backend): implementar endpoints {lista de rotas}
feat(frontend): criar tela {nome} com componentes {lista}
feat(sre): adicionar Dockerfile e manifests k8s para {cloud}
docs: atualizar README e context bank
```

### Merge

```
git merge --no-ff {branch} -m "merge({escopo}): {descricao} v{x.y.z}"
```

### Tag (semver)

| Tipo de mudança | Bump |
|---|---|
| Novo agente, nova skill, nova feature | MINOR (x.**Y**.0) |
| Correção, ajuste, atualização de doc | PATCH (x.y.**Z**) |
| Quebra de compatibilidade ou redesign | MAJOR (**X**.0.0) |

---

## Passo 3 — Registre encerramento no log

Invoque `DevKit-cerebro` em modo `POST_TASK`:

```
Modo: POST_TASK
Agente: DevKit-orquestrador
Ação: sessao encerrada — git workflow executado
Arquivos: —
Resultado do Tester: PASS
Pendências: {pendências identificadas para próxima sessão, ou "—"}
```

---

## Passo 4 — Apresente ao usuário para confirmação

Antes de executar qualquer git command, apresente o resumo completo:

```
## Resumo da Sessão — {data}

### Camadas concluídas
- Banco de Dados ✅: {arquivos principais — ex: migrations/1_init.sql}
- Backend ✅: {arquivos — ex: src/handlers/users.rs, src/repository/user_repository.rs}
- Frontend ✅: {arquivos — ex: src/pages/users/index.tsx}

### Git Workflow
- Branch: {nome}
- Commits:
  1. {mensagem commit 1}
  2. {mensagem commit 2}
- Merge: git merge --no-ff {branch} -m "{mensagem merge}"
- Tag: {versão}

### Pendências para próxima sessão
- {item 1 — ou "nenhuma"}

Confirme para executar o git workflow ou ajuste antes de prosseguir.
```

---

## Regras

- Nunca execute commits sem apresentar o resumo ao usuário e receber confirmação
- Se houver `FAIL_BLOCKED` não resolvido: `[ATENÇÃO] Há bloqueios não resolvidos. Recomendo resolver antes de commitar.`
- O log de execução no context.md deve sempre ter a entrada de encerramento — o histórico é permanente e nunca é deletado
- A tag só é criada se houver merge — nunca tague a branch antes do merge para main
