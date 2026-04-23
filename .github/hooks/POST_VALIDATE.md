# Hook: POST_VALIDATE

Executado pelo `DevKit-cerebro` em modo `POST_TASK` após o Tester retornar `PASS` ou `FAIL_FIXABLE` resolvido.

---

## Quando Executar

- Após `POST_IMPLEMENT` retornar `PASS` (ou `FAIL_FIXABLE` corrigido)
- NUNCA executar após `FAIL_BLOCKED` — o fluxo está pausado aguardando o usuário

---

## O Que Receber

```
Modo: POST_TASK
Agente: {nome do agente que implementou}
Ação: {descrição do que foi feito}
Arquivos: {lista de arquivos criados/modificados}
Resultado do Tester: {PASS | FAIL_FIXABLE}
Pendências: {o que o tester apontou como aviso, se houver — caso contrário: "—"}
```

---

## O Que Atualizar em `.DevKit/context.md`

### 1. `## Estado por Camada (Hooks Status)`

Atualize o status da camada correspondente:

| De | Para |
|---|---|
| ⏳ Não Iniciado | 🔄 Em Progresso ou ✅ Concluído |
| 🔄 Em Progresso | ✅ Concluído |

Atualize também: agente responsável e data no formato `YYYY-MM-DD HH:MM`.

### 2. `## Log de Execução (Hook Events)`

Adicione uma linha ao **final** da tabela (nunca delete entradas anteriores):

```
| {YYYY-MM-DD HH:MM} | {agente} | {ação em ≤60 chars} | {lista de arquivos} | ✅ PASS |
```

### 3. `## Histórico de Validações (Tester)`

Adicione o registro da validação:

```
| {feature ou endpoint validado} | ✅ PASS | {pendências ou —} | {YYYY-MM-DD} |
```

### 4. `## Próximos Passos`

Atualize com base no novo estado das camadas — remova o que foi concluído e adicione o que ficou pendente.

---

## Detecção de Conflitos

Após atualizar o context.md, verifique ativamente os seguintes tipos de conflito:

| Tipo | Como detectar |
|---|---|
| Tabela no backend não existe no banco | Compare nomes de tabelas usados no backend com as migrations criadas |
| Endpoint no frontend não existe no backend | Compare chamadas `fetch('/api/...')` com rotas registradas no backend |
| Porta no Dockerfile diverge do k8s Service | Compare `EXPOSE` com `containerPort` no manifest |
| Lib no código diverge das libs adotadas | Compare imports reais com `## Libs Adotadas` no context.md |
| Convenção violada | Compare código gerado com `## Restrições e Convenções` |

Se detectar conflito:
1. Registre em `## Perguntas em Aberto`: `[CONFLITO] {descrição com evidência concreta}`
2. Inclua no output: `[CONFLITO DETECTADO] {descrição}`
3. Recomende ação: qual agente deve resolver e o que fazer exatamente

---

## O Que Produzir

```
[POST_VALIDATE] context.md atualizado
Camada {nome}: {status anterior} → {novo status}
Log entry: #{número sequencial}
Conflitos detectados: {nenhum | lista de conflitos}
Próximo agente recomendado: {nome do agente | "aguardar instrução do usuário"}
```

---

## Exemplo de Output Completo

```
[POST_VALIDATE] context.md atualizado
Camada Backend: ⏳ Não Iniciado → ✅ Concluído
Log entry: #3
Conflitos detectados: nenhum
Próximo agente recomendado: DevKit-frontend
```

```
[POST_VALIDATE] context.md atualizado
Camada Backend: ⏳ Não Iniciado → ✅ Concluído
Log entry: #3
Conflitos detectados:
  [CONFLITO] Handler GET /users/:id referencia coluna "profile_picture" — coluna não existe na migration 1_init.sql (apenas: id, name, email, created_at, updated_at)
  Ação: DevKit-banco-dados deve criar migration adicionando coluna profile_picture à tabela users
Próximo agente recomendado: aguardar resolução do conflito antes de avançar para frontend
```
