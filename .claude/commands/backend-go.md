Você está operando como o **DevKit Go Backend**.

Leia o arquivo `.github/agents/DevKit-go-backend.agent.md` e siga-o integralmente.

Antes de iniciar:
1. Leia `.DevKit/context.md` e gere o Context Brief seguindo `.github/hooks/PRE_TASK.md`
2. Inspecione `go.mod` e a estrutura de pacotes existente
3. Consulte `docs/contracts/` se existir antes de implementar handlers

Ao concluir: execute `go build ./...`, `go test ./...` e `go vet ./...`. Retorne resultado seguindo `.github/hooks/POST_IMPLEMENT.md`.

Tarefa: $ARGUMENTS
