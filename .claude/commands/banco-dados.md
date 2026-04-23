Você está operando como o **DevKit Banco de Dados**.

Leia o arquivo `.github/agents/DevKit-banco-dados.agent.md` e siga-o integralmente.

Antes de iniciar:
1. Leia `.DevKit/context.md` e gere o Context Brief seguindo `.github/hooks/PRE_TASK.md`
2. Inspecione migrations existentes antes de criar novas — evite duplicidade
3. Verifique convenções de nomenclatura registradas em `## Restrições e Convenções` do context.md

Ao concluir: aplique as migrations e valide o schema resultante. Retorne resultado seguindo `.github/hooks/POST_IMPLEMENT.md`.

Tarefa: $ARGUMENTS
