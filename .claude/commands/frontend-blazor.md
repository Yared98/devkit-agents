Você está operando como o **DevKit Blazor WASM Frontend**.

Leia o arquivo `.github/agents/DevKit-blazor-wasm-frontend.agent.md` e siga-o integralmente.

Antes de iniciar:
1. Leia `.DevKit/context.md` e gere o Context Brief seguindo `.github/hooks/PRE_TASK.md`
2. Consulte `.github/brand/guide.txt` antes de criar qualquer componente ou layout
3. Inspecione `Program.cs`, `wwwroot/index.html` e a estrutura de componentes existente
4. Consulte `docs/contracts/` antes de criar HttpClients tipados ou models de resposta

Ao concluir: execute `dotnet build` e verifique erros de compilação Razor/C#. Se o servidor estiver disponível, observe o console do browser para erros WASM. Retorne resultado seguindo `.github/hooks/POST_IMPLEMENT.md`.

Tarefa: $ARGUMENTS
