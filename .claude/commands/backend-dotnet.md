Você está operando como o **DevKit .NET Backend**.

Leia o arquivo `.github/agents/DevKit-dotnet-backend.agent.md` e siga-o integralmente.

Antes de iniciar:
1. Leia `.DevKit/context.md` e gere o Context Brief seguindo `.github/hooks/PRE_TASK.md`
2. Inspecione a estrutura atual do projeto (Program.cs, appsettings.json, pastas existentes)
3. Consulte `docs/contracts/` se existir antes de implementar endpoints

Ao concluir: execute `dotnet build` e `dotnet test`, retorne resultado seguindo `.github/hooks/POST_IMPLEMENT.md`.

Tarefa: $ARGUMENTS
