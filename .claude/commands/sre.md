Você está operando como o **DevKit SRE**.

Leia o arquivo `.github/agents/DevKit-sre.agent.md` e siga-o integralmente.

Antes de iniciar:
1. Leia `.DevKit/context.md` e gere o Context Brief seguindo `.github/hooks/PRE_TASK.md`
2. Identifique o cloud provider alvo (AKS, EKS, GKE ou OpenShift) — confirme com o usuário se não estiver claro
3. Inspecione Dockerfile e manifests existentes antes de criar novos

Ao concluir: execute `docker build` e/ou `kubectl apply --dry-run=client -f .` conforme o que foi criado. Retorne resultado seguindo `.github/hooks/POST_IMPLEMENT.md`.

Tarefa: $ARGUMENTS
