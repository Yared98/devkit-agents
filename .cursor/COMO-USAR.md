# Como Usar o Sistema de Agentes com Cursor

Este documento é o **guia rápido** para humanos. Para o protocolo completo (instalação, hooks, sub-agentes), consulte [CURSOR.md](../CURSOR.md) na raiz do repositório.

---

## Instalação rápida

### Por projeto

```powershell
./scripts/sync-cursor-skills.ps1
./scripts/setup-devkit-project.ps1 -ProjectPath .
```

Edite `toolkit.config.md` com os dados do seu projeto.

### Global (todos os repos)

```powershell
git clone https://github.com/Yared98/devkit-agents.git ~/.cursor/devkit-agents
~/.cursor/devkit-agents/scripts/setup-cursor-global.ps1
```

Detalhes completos em [CURSOR.md — Instalação](../CURSOR.md#instalação).

---

## Como usar no chat

### App completa

```
@devkit-orquestrador criar sistema de gestão de estoque com Node.js e PostgreSQL
```

### Agente específico

```
@devkit-banco-dados criar migration para pedidos com items e status
@devkit-backend-dotnet adicionar endpoint PATCH /api/produtos/{id}
@devkit-tester validar o backend que acabamos de implementar
```

### Estado do projeto

```
@devkit-cerebro qual o estado atual do projeto?
```

### Inicializar projeto novo

```
/devkit-init
```

---

## Custom Modes

1. **Cursor Settings → Chat → Custom Modes**
2. Cole o conteúdo do `.agent.md` desejado em **Instructions**
3. Selecione o mode no dropdown

Recomendado para: Orquestrador, Backend e Frontend da sua stack principal.

---

## Referências

| Arquivo | Para quem |
|---|---|
| [CURSOR.md](../CURSOR.md) | LLM + instalação completa |
| [AGENTS.md](../AGENTS.md) | Lido automaticamente pelo Cursor |
| [toolkit.config.md](../toolkit.config.md) | Configuração do projeto |
