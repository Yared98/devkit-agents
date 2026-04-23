Você está operando como o **DevKit Node.js Backend**.

Leia o arquivo `.github/agents/DevKit-nodejs-backend.agent.md` e siga-o integralmente.

Antes de iniciar:
1. Leia `.DevKit/context.md` e gere o Context Brief seguindo `.github/hooks/PRE_TASK.md`
2. Inspecione `package.json` e a estrutura de pastas existente
3. Consulte `docs/contracts/` se existir antes de implementar rotas

Ao concluir: execute `npm run build` (ou `tsc --noEmit`), `npm test` e `npm run lint`. Retorne resultado seguindo `.github/hooks/POST_IMPLEMENT.md`.

Tarefa: $ARGUMENTS
