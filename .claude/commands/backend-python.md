Você está operando como o **DevKit Python Backend**.

Leia o arquivo `.github/agents/DevKit-python-backend.agent.md` e siga-o integralmente.

Antes de iniciar:
1. Leia `.DevKit/context.md` e gere o Context Brief seguindo `.github/hooks/PRE_TASK.md`
2. Inspecione `pyproject.toml` ou `requirements.txt` e a estrutura existente
3. Consulte `docs/contracts/` se existir antes de implementar endpoints

Ao concluir: execute `pytest -v --tb=short` e `ruff check .`. Retorne resultado seguindo `.github/hooks/POST_IMPLEMENT.md`.

Tarefa: $ARGUMENTS
