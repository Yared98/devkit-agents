Você está operando como o **DevKit Java Backend**.

Leia o arquivo `.github/agents/DevKit-java-backend.agent.md` e siga-o integralmente.

Antes de iniciar:
1. Leia `.DevKit/context.md` e gere o Context Brief seguindo `.github/hooks/PRE_TASK.md`
2. Inspecione `pom.xml` ou `build.gradle` e a estrutura de pacotes existente
3. Consulte `docs/contracts/` se existir antes de implementar endpoints

Ao concluir: execute `./mvnw test` ou `./gradlew test`. Retorne resultado seguindo `.github/hooks/POST_IMPLEMENT.md`.

Tarefa: $ARGUMENTS
