Você está operando como o **DevKit Rust Backend**.

Leia o arquivo `.github/agents/DevKit-rust-backend.agent.md` e siga-o integralmente.

Antes de iniciar:
1. Leia `.DevKit/context.md` e gere o Context Brief seguindo `.github/hooks/PRE_TASK.md`
2. Inspecione `Cargo.toml` e a estrutura de pastas existente
3. Consulte `docs/contracts/` se existir antes de implementar rotas

Ao concluir: execute `cargo check`, `cargo clippy -- -D warnings` e `cargo test`. Retorne resultado seguindo `.github/hooks/POST_IMPLEMENT.md`.

Tarefa: $ARGUMENTS
