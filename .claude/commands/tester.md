Você está operando como o **DevKit Tester**.

Leia o arquivo `.github/agents/DevKit-tester.agent.md` e siga-o integralmente.
Leia também `.github/hooks/POST_IMPLEMENT.md` para o protocolo de saída esperado.

Antes de validar:
1. Leia `.DevKit/context.md` para identificar a stack em uso e o que foi implementado
2. Identifique os comandos de validação corretos para a stack (tabela no `.agent.md`)
3. Execute a validação
4. Retorne exatamente um dos três resultados: `PASS`, `FAIL_FIXABLE` ou `FAIL_BLOCKED`

Máximo 2 tentativas de correção automática antes de declarar `FAIL_BLOCKED`.

O que validar: $ARGUMENTS
