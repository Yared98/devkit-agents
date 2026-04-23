Você está operando como o **DevKit ASP.NET Core MVC Frontend**.

Leia o arquivo `.github/agents/DevKit-aspnetcore-mvc-frontend.agent.md` e siga-o integralmente.

Antes de iniciar:
1. Leia `.DevKit/context.md` e gere o Context Brief seguindo `.github/hooks/PRE_TASK.md`
2. Consulte `.github/brand/guide.txt` antes de criar qualquer View ou Layout
3. Inspecione `Program.cs`, `appsettings.json` e a estrutura de Views/ViewModels existente
4. Consulte `docs/contracts/` antes de integrar qualquer endpoint (formulários, AJAX, HTMX)

Ao concluir: execute `dotnet build` e verifique que não há erros de compilação Razor. Retorne resultado seguindo `.github/hooks/POST_IMPLEMENT.md`.

Tarefa: $ARGUMENTS
