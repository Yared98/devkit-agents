
# Decisão de Linguagem Backend

## Quando Usar

Antes de delegar para qualquer agente de backend especializado, o orquestrador deve invocar esta skill quando:
- A linguagem não foi especificada pelo usuário
- O usuário está em dúvida entre 2+ linguagens
- O contexto (escala, equipe, prazo) pode tornar a escolha padrão inadequada

---

## Critérios de Avaliação

Avalie cada critério com base nas respostas da entrevista:

| Critério | Peso | Perguntas-chave |
|---|---|---|
| **Performance / Latência** | Alto | Requer < 10ms p99? Zero GC pause? Millões de req/dia? |
| **Expertise da equipe** | Alto | Quantos devs conhecem a linguagem? Nível médio? |
| **Prazo** | Alto | < 4 semanas = evite curva de aprendizado steep |
| **Domínio** | Médio | Regras de negócio complexas = prefira expressividade |
| **Ecossistema** | Médio | Libs maduras disponíveis para o problema específico? |
| **Operações** | Médio | Consumo de memória, tamanho de imagem, cold start |
| **Longevidade** | Baixo | Produto estratégico = prefira linguagem com suporte longo |

---

## Matriz de Decisão

### Use Rust quando

- Latência é crítica (< 5ms p99) ou throughput extremo (> 500k req/s)
- Zero GC pause é requisito (sistemas de trading, games, real-time)
- Segurança de memória é mandatória sem overhead de runtime
- Imagem Docker mínima é requisito (< 20MB com distroless)
- Servidores MCP ou ferramentas CLI de alta performance
- Equipe tem ≥ 1 desenvolvedor Rust experiente
- **NÃO use Rust quando**: prazo < 6 semanas sem dev Rust no time; CRUD simples sem requisitos de performance; equipe 100% júnior

### Use Go quando

- Simplicidade operacional é prioritária sobre performance máxima
- Microserviços com muita concorrência I/O (goroutines baratas)
- Ferramentas de DevOps, CLIs, proxies, sidecars
- Time quer compilação rápida + deploy simples
- Performance boa (não extrema) é suficiente
- **NÃO use Go quando**: domínio rico com lógica complexa (falta de generics expressivos); necessidade de ecossistema de libs enterprise

### Use Java (Quarkus / Spring Boot) quando

- Time já tem expertise Java ou vem de legado Java/JVM
- Enterprise: integração com sistemas existentes (JMS, SOAP, legado)
- Domínio rico com regras de negócio complexas (DDD, Event Sourcing)
- Quarkus para cloud-native com startup rápido e imagem nativa GraalVM
- Spring Boot para ecossistema maduro e equipes grandes
- **NÃO use Java quando**: cold start é crítico sem GraalVM configurado; imagem mínima obrigatória; equipe sem experiência JVM

### Use .NET (C# / ASP.NET Core) quando

- Time tem expertise .NET ou contexto Windows/Azure
- APIs de alta performance com Minimal APIs (.NET 10)
- Integração com ecossistema Microsoft (Azure, Active Directory, Office 365)
- Aplicações enterprise com ORM rico (EF Core) e CQRS com MediatR
- **NÃO use .NET quando**: equipe sem C#; restrição de licença ou custo de cloud Azure

### Use Node.js (TypeScript / Fastify) quando

- Time fullstack — mesmo desenvolvedor faz front e back
- Prototipagem rápida, MVP com deadline curto
- APIs com muita I/O e pouca CPU (Node single-thread não é gargalo)
- Compartilhamento de tipos com frontend TypeScript (monorepo)
- **NÃO use Node.js quando**: CPU-intensive (processamento, encoding, ML); alta concorrência com estado shared; equipe sem experiência async/event-loop

### Use Python (FastAPI / Django) quando

- Data science, ML pipelines ou integração com bibliotecas de IA (PyTorch, LangChain)
- APIs de integração e automação (webhooks, processamento de dados)
- Time com expertise Python ou projeto com cientistas de dados
- Prototipagem exploratória
- **NÃO use Python quando**: latência < 50ms é crítica; alta concorrência sem workers; equipe sem domínio de async Python

---

## Comparativo Rápido

| Critério | Rust | Go | Java | .NET | Node.js | Python |
|---|---|---|---|---|---|---|
| Performance raw | ★★★★★ | ★★★★ | ★★★★ | ★★★★ | ★★★ | ★★ |
| Segurança de memória | ★★★★★ | ★★★ | ★★★ | ★★★ | ★★ | ★★ |
| Tempo de startup | ★★★★★ | ★★★★★ | ★★ (★★★★★ GraalVM) | ★★★★ | ★★★★ | ★★★ |
| Curva de aprendizado | ★ (difícil) | ★★★★ | ★★★ | ★★★ | ★★★★ | ★★★★★ |
| Ecossistema backend | ★★★ | ★★★★ | ★★★★★ | ★★★★★ | ★★★★★ | ★★★★★ |
| Tamanho de imagem | ★★★★★ | ★★★★★ | ★★ | ★★★ | ★★★ | ★★ |
| Produtividade | ★★ | ★★★★ | ★★★ | ★★★★ | ★★★★★ | ★★★★★ |

---

## Procedimento

### Passo 1 — Colete o contexto mínimo

Se não disponível da entrevista de arquitetura, pergunte:
1. Qual o requisito de latência? (< 10ms / < 100ms / flexível)
2. Qual o tamanho e expertise da equipe de backend?
3. Qual o prazo para MVP funcional?
4. Há integração com sistemas existentes (Java/JVM, .NET/Windows, Python/ML)?

### Passo 2 — Aplique a matriz

1. Elimine linguagens onde há um **NÃO use** com alto impacto (prazo, equipe)
2. Ranqueie as restantes pelos critérios de peso Alto
3. Se empate: prefira a que o time conhece melhor

### Passo 3 — Documente a decisão

Registre no `.devkit/context.md`:
```
## Decisão de Linguagem — [data]
**Escolhida**: [linguagem] — [agente a invocar]
**Justificativa**: [2-3 bullets com critérios que determinaram a escolha]
**Descartadas**:
- [linguagem A]: [motivo]
- [linguagem B]: [motivo]
```

---

## Output Esperado

- Linguagem recomendada com justificativa em bullets
- Agente a invocar: `DevKit-[linguagem]-backend`
- Linguagens descartadas com motivo objetivo
- Registro no context bank para não reabrir a discussão
